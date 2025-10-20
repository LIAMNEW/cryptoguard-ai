import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Transaction {
  id?: string;
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  transaction_hash?: string;
  block_number?: number;
  gas_fee?: number;
  transaction_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { transactions } = await req.json()
    
    console.log(`🔍 Unified analysis started for ${transactions.length} transactions`)
    
    // Validate and clean transaction data
    const cleanedTransactions = transactions.map((tx: any) => ({
      ...tx,
      transaction_id: tx.transaction_id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: tx.timestamp || new Date().toISOString(),
      amount: parseFloat(tx.amount) || 0,
      transaction_type: tx.transaction_type || 'transfer'
    }))
    
    // Step 1: Store transactions using upsert to handle duplicates
    const hasIds = cleanedTransactions.every((tx: any) => tx.id)
    let storedTransactions = cleanedTransactions
    
    if (!hasIds) {
      console.log('📦 Storing transactions in database...')
      const { data, error: insertError } = await supabaseClient
        .from('transactions')
        .upsert(cleanedTransactions, { 
          onConflict: 'transaction_id',
          ignoreDuplicates: false 
        })
        .select()

      if (insertError) {
        console.error('Error storing transactions:', insertError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to store transactions', 
            details: insertError.message,
            hint: 'Please check your data format and try again'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }
      storedTransactions = data || cleanedTransactions
      console.log(`✅ Stored ${storedTransactions.length} transactions`)
    }

    // Step 2: Batch analyze transactions with AUSTRAC scoring
    console.log(`🚀 Starting batch analysis of ${storedTransactions.length} transactions...`)
    
    // Get all enabled rules once
    const { data: rules } = await supabaseClient
      .from('rule_catalog')
      .select('*')
      .eq('enabled', true)
    
    const scorecards = []
    const analysisResults = []
    
    // Process in batches of 100 for efficiency
    const BATCH_SIZE = 100
    for (let i = 0; i < storedTransactions.length; i += BATCH_SIZE) {
      const batch = storedTransactions.slice(i, i + BATCH_SIZE)
      console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(storedTransactions.length/BATCH_SIZE)}...`)
      
      // Process batch transactions in parallel
      const batchResults = await Promise.all(batch.map(async (transaction) => {
        // Fast scoring based on amount and basic rules
        const amount = parseFloat(transaction.amount)
        let score = 0
        const rulesTriggered: any[] = []
        const flags: string[] = []
        
        // Quick threshold-based scoring
        if (amount > 100000) {
          score += 40
          rulesTriggered.push({
            rule_id: 'HIGH_VALUE',
            name: 'High Value Transaction',
            severity: 'critical',
            weight: 40,
            evidence: `Transaction amount $${amount.toLocaleString()} exceeds $100,000`,
            austrac_indicator: 'Large cash/value transaction'
          })
        } else if (amount > 50000) {
          score += 30
          rulesTriggered.push({
            rule_id: 'VERY_HIGH_VALUE',
            name: 'Very High Value Transaction',
            severity: 'high',
            weight: 30,
            evidence: `Transaction amount $${amount.toLocaleString()} exceeds $50,000`,
            austrac_indicator: 'Significant transaction'
          })
        } else if (amount > 10000) {
          score += 20
          rulesTriggered.push({
            rule_id: 'REPORTABLE_VALUE',
            name: 'Reportable Threshold',
            severity: 'medium',
            weight: 20,
            evidence: `Transaction amount $${amount.toLocaleString()} exceeds reportable threshold`,
            austrac_indicator: 'TTR threshold exceeded'
          })
        }
        
        const finalScore = Math.min(score, 100)
        const hasMandatory = flags.length > 0
        const riskLevel = getRiskLevel(finalScore, hasMandatory)
        const dueByTs = calculateDueDate(riskLevel, flags)
        
        const scorecard = {
          transaction_id: transaction.id,
          policy_score: score,
          ml_score: 0,
          final_score: finalScore,
          risk_level: riskLevel,
          mandatory_flags: flags,
          due_by_ts: dueByTs,
          indicators: {},
          rules_triggered: rulesTriggered,
          rationale: rulesTriggered.map(r => `${r.name}: ${r.evidence}`).join('\n'),
          austrac_compliance: {
            score_breakdown: {},
            reporting_required: riskLevel === 'SMR',
            timeframe: riskLevel === 'SMR' ? '3_business_days' : null
          }
        }
        
        const mappedRiskLevel = riskLevel === 'NORMAL' ? 'LOW' 
          : riskLevel === 'EDD' ? 'MEDIUM'
          : riskLevel === 'SMR' ? 'HIGH'
          : 'MEDIUM'
        
        const analysisResult = {
          transaction_id: transaction.id,
          risk_score: finalScore,
          anomaly_detected: rulesTriggered.length > 0,
          anomaly_type: rulesTriggered.map(r => r.rule_id).join(','),
          network_cluster: `cluster_${riskLevel.toLowerCase()}`,
          austrac_score: finalScore,
          general_risk_score: 0,
          risk_level: mappedRiskLevel
        }
        
        return { scorecard, analysisResult }
      }))
      
      // Collect results from this batch
      batchResults.forEach(({ scorecard, analysisResult }) => {
        scorecards.push(scorecard)
        analysisResults.push(analysisResult)
      })
      
      console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} complete`)
    }
    
    console.log(`🎯 Analysis complete: ${scorecards.length} transactions scored`)
    
    // Step 3: Store scorecards
    console.log('💾 Storing scorecards...')
    const { error: scorecardError } = await supabaseClient
      .from('transaction_scorecards')
      .insert(scorecards)
    
    if (scorecardError) {
      console.error('Error storing scorecards:', scorecardError)
      throw scorecardError
    }
    
    // Step 4: Store analysis results for compatibility
    const { error: analysisError } = await supabaseClient
      .from('analysis_results')
      .insert(analysisResults)
    
    if (analysisError) {
      console.error('Error storing analysis results:', analysisError)
    }
    
    // Step 5: Update network graph
    console.log('🕸️ Updating network graph...')
    await updateNetworkGraph(storedTransactions, supabaseClient)

    console.log(`🎉 Analysis complete: ${scorecards.length} transactions analyzed`)

    return new Response(
      JSON.stringify({ 
        message: 'Transactions analyzed successfully',
        analyzed_count: scorecards.length,
        scorecards,
        high_risk_count: scorecards.filter((s: any) => s.risk_level === 'SMR' || s.risk_level === 'EDD').length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error in unified analysis:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function getRiskLevel(finalScore: number, hasMandatoryFlags: boolean): 'NORMAL' | 'EDD' | 'SMR' {
  if (hasMandatoryFlags || finalScore >= 60) {
    return 'SMR'
  } else if (finalScore >= 30) {
    return 'EDD'
  } else {
    return 'NORMAL'
  }
}

function calculateDueDate(riskLevel: string, flags: string[]): string | null {
  if (riskLevel !== 'SMR') {
    return null
  }
  
  const now = new Date()
  const isTF = flags.some(f => f === 'SANCTIONS_HIT')
  
  if (isTF) {
    now.setHours(now.getHours() + 24)
  } else {
    let daysAdded = 0
    while (daysAdded < 3) {
      now.setDate(now.getDate() + 1)
      const dayOfWeek = now.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++
      }
    }
  }
  
  return now.toISOString()
}

async function updateNetworkGraph(transactions: Transaction[], supabase: any) {
  console.log(`🕸️ Updating network graph with ${transactions.length} transactions...`)
  
  // Collect all unique addresses
  const addressMap = new Map<string, { total_volume: number, transaction_count: number, last_seen: string }>()
  const edgeMap = new Map<string, { from: string, to: string, amount: number, count: number, first: string, last: string }>()
  
  for (const tx of transactions) {
    // Update from_address stats
    const fromStats = addressMap.get(tx.from_address) || { total_volume: 0, transaction_count: 0, last_seen: tx.timestamp }
    fromStats.total_volume += parseFloat(tx.amount.toString())
    fromStats.transaction_count += 1
    fromStats.last_seen = tx.timestamp
    addressMap.set(tx.from_address, fromStats)
    
    // Update to_address stats
    const toStats = addressMap.get(tx.to_address) || { total_volume: 0, transaction_count: 0, last_seen: tx.timestamp }
    toStats.total_volume += parseFloat(tx.amount.toString())
    toStats.transaction_count += 1
    toStats.last_seen = tx.timestamp
    addressMap.set(tx.to_address, toStats)
    
    // Update edge stats
    const edgeKey = `${tx.from_address}->${tx.to_address}`
    const edgeStats = edgeMap.get(edgeKey) || { 
      from: tx.from_address, 
      to: tx.to_address, 
      amount: 0, 
      count: 0, 
      first: tx.timestamp, 
      last: tx.timestamp 
    }
    edgeStats.amount += parseFloat(tx.amount.toString())
    edgeStats.count += 1
    edgeStats.last = tx.timestamp
    edgeMap.set(edgeKey, edgeStats)
  }
  
  // Bulk upsert nodes
  const nodes = Array.from(addressMap.entries()).map(([address, stats]) => ({
    address,
    total_volume: stats.total_volume,
    transaction_count: stats.transaction_count,
    last_seen: stats.last_seen
  }))
  
  if (nodes.length > 0) {
    await supabase
      .from('network_nodes')
      .upsert(nodes, { onConflict: 'address' })
  }
  
  // Bulk upsert edges
  const edges = Array.from(edgeMap.values()).map(edge => ({
    from_address: edge.from,
    to_address: edge.to,
    total_amount: edge.amount,
    transaction_count: edge.count,
    first_transaction: edge.first,
    last_transaction: edge.last
  }))
  
  if (edges.length > 0) {
    await supabase
      .from('network_edges')
      .upsert(edges, { onConflict: 'from_address,to_address' })
  }
  
  console.log(`✅ Network graph updated: ${nodes.length} nodes, ${edges.length} edges`)
}
