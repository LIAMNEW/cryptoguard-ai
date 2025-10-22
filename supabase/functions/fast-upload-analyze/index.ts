import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Transaction {
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  transaction_type?: string;
  currency?: string;
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

    const { fileContent, fileName } = await req.json()
    
    console.log(`🚀 Fast upload: ${fileName} (${fileContent.length} bytes)`)
    
    // Parse based on file type
    let transactions: Transaction[] = []
    const fileExt = fileName.toLowerCase().split('.').pop()
    
    if (fileExt === 'csv') {
      transactions = parseCSV(fileContent)
    } else if (fileExt === 'json') {
      transactions = parseJSON(fileContent)
    } else {
      throw new Error('Unsupported file format. Use CSV or JSON.')
    }
    
    console.log(`📊 Parsed ${transactions.length} transactions`)
    
    if (transactions.length === 0) {
      throw new Error('No valid transactions found in file')
    }
    
    // Clean and validate transactions
    const cleanedTransactions = transactions.map((tx, idx) => ({
      transaction_id: tx.transaction_id || `tx_${Date.now()}_${idx}`,
      from_address: tx.from_address || 'unknown',
      to_address: tx.to_address || 'unknown',
      amount: parseFloat(String(tx.amount)) || 0,
      timestamp: tx.timestamp || new Date().toISOString(),
      transaction_type: tx.transaction_type || 'transfer',
      currency: tx.currency || 'AUD'
    }))
    
    // Bulk insert transactions
    console.log('💾 Bulk inserting transactions...')
    const { data: insertedTxs, error: insertError } = await supabaseClient
      .from('transactions')
      .upsert(cleanedTransactions, { 
        onConflict: 'transaction_id',
        ignoreDuplicates: false 
      })
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to insert transactions: ${insertError.message}`)
    }

    const storedTxs = insertedTxs || cleanedTransactions
    console.log(`✅ Stored ${storedTxs.length} transactions`)
    
    // Fast batch AUSTRAC scoring
    console.log('⚡ Running fast AUSTRAC analysis...')
    const scorecards = await fastAUSTRACAnalysis(storedTxs, supabaseClient)
    
    // Bulk insert scorecards
    const { error: scorecardError } = await supabaseClient
      .from('transaction_scorecards')
      .insert(scorecards)
    
    if (scorecardError) {
      console.error('Scorecard error:', scorecardError)
    }
    
    // Insert analysis results for compatibility
    const analysisResults = scorecards.map(sc => ({
      transaction_id: sc.transaction_id,
      risk_score: sc.final_score,
      anomaly_detected: sc.final_score >= 30,
      anomaly_type: sc.mandatory_flags.join(','),
      network_cluster: `cluster_${sc.risk_level.toLowerCase()}`,
      austrac_score: sc.final_score,
      general_risk_score: 0,
      risk_level: sc.risk_level === 'SMR' ? 'HIGH' : sc.risk_level === 'EDD' ? 'MEDIUM' : 'LOW'
    }))
    
    await supabaseClient
      .from('analysis_results')
      .insert(analysisResults)
    
    // Update network graph
    await updateNetworkGraph(storedTxs, supabaseClient)
    
    const highRiskCount = scorecards.filter(s => s.risk_level === 'SMR').length
    const avgScore = scorecards.reduce((sum, s) => sum + s.final_score, 0) / scorecards.length
    
    console.log(`🎉 Complete: ${scorecards.length} analyzed, ${highRiskCount} high-risk, avg score ${avgScore.toFixed(1)}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        total_transactions: scorecards.length,
        new_transactions: scorecards.length,
        duplicates: 0,
        high_risk_count: highRiskCount,
        average_risk_score: avgScore,
        processing_time_ms: Date.now()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Fast upload error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const transactions: Transaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
    const tx: any = {}
    
    headers.forEach((header, idx) => {
      tx[header] = values[idx]
    })
    
    // Map common column names
    transactions.push({
      transaction_id: tx.transaction_id || tx.id || tx.txn_id || `tx_${i}`,
      from_address: tx.from_address || tx.from || tx.sender || tx.source || 'unknown',
      to_address: tx.to_address || tx.to || tx.recipient || tx.destination || 'unknown',
      amount: parseFloat(tx.amount || tx.value || '0'),
      timestamp: tx.timestamp || tx.date || tx.time || new Date().toISOString(),
      transaction_type: tx.transaction_type || tx.type || 'transfer',
      currency: tx.currency || 'AUD'
    })
  }
  
  return transactions
}

function parseJSON(content: string): Transaction[] {
  const data = JSON.parse(content)
  const array = Array.isArray(data) ? data : [data]
  
  return array.map((item, idx) => ({
    transaction_id: item.transaction_id || item.id || item.txn_id || `tx_${idx}`,
    from_address: item.from_address || item.from || item.sender || 'unknown',
    to_address: item.to_address || item.to || item.recipient || 'unknown',
    amount: parseFloat(String(item.amount || item.value || 0)),
    timestamp: item.timestamp || item.date || new Date().toISOString(),
    transaction_type: item.transaction_type || item.type || 'transfer',
    currency: item.currency || 'AUD'
  }))
}

async function fastAUSTRACAnalysis(transactions: any[], supabase: any) {
  const scorecards = []
  
  // Build address frequency map for velocity detection
  const addressFreq = new Map<string, number>()
  transactions.forEach(tx => {
    addressFreq.set(tx.from_address, (addressFreq.get(tx.from_address) || 0) + 1)
  })
  
  for (const tx of transactions) {
    const amount = parseFloat(tx.amount)
    let score = 0
    const rulesTriggered: any[] = []
    const flags: string[] = []
    const explanations: string[] = []
    
    // RULE 1: Large Transactions (≥ $10,000 AUD)
    if (amount >= 10000) {
      const points = Math.min(30, Math.floor((amount - 10000) / 1000))
      score += points
      explanations.push(`Large transaction: $${amount.toLocaleString()}`)
      rulesTriggered.push({
        rule_id: 'LARGE_TRANSACTION',
        name: 'Large Transaction Detection',
        severity: amount >= 100000 ? 'critical' : 'high',
        weight: points
      })
    }
    
    // RULE 2: Structuring (just below $10k threshold)
    if (amount >= 9000 && amount < 10000) {
      score += 25
      explanations.push('Possible structuring')
      flags.push('STRUCTURING_SUSPECTED')
      rulesTriggered.push({
        rule_id: 'STRUCT_CASH',
        name: 'Structuring Detection',
        severity: 'critical',
        weight: 25
      })
    }
    
    // RULE 3: Round Amounts
    if (amount % 1000 === 0 || amount % 500 === 0) {
      score += 10
      explanations.push('Round amount')
      rulesTriggered.push({
        rule_id: 'ROUND_AMOUNT',
        name: 'Round Amount Pattern',
        severity: 'medium',
        weight: 10
      })
    }
    
    // RULE 4: High-Risk Geographic Destinations
    const highRiskCountries = ['KY', 'PA', 'VG', 'BM', 'LI', 'MC', 'BS', 'TC', 'KP', 'IR', 'SY']
    const toAddress = tx.to_address?.toUpperCase() || ''
    const isHighRisk = highRiskCountries.some(c => toAddress.includes(c))
    
    if (isHighRisk) {
      score += 20
      explanations.push('High-risk jurisdiction')
      flags.push('HIGH_RISK_JURISDICTION')
      rulesTriggered.push({
        rule_id: 'HIGH_RISK_JURISDICTION',
        name: 'High-Risk Jurisdiction',
        severity: 'high',
        weight: 20
      })
    }
    
    // RULE 5: Cash Transactions
    if (tx.transaction_type?.toLowerCase().includes('cash')) {
      score += 15
      explanations.push('Cash transaction')
      rulesTriggered.push({
        rule_id: 'CASH_TRANSACTION',
        name: 'Cash Transaction',
        severity: 'medium',
        weight: 15
      })
    }
    
    // RULE 7: Velocity (using frequency map - no DB queries!)
    const txCount = addressFreq.get(tx.from_address) || 0
    if (txCount > 5) {
      const velocityScore = Math.min(20, txCount * 3)
      score += velocityScore
      explanations.push(`High velocity: ${txCount} transactions`)
      rulesTriggered.push({
        rule_id: 'VELOCITY_SPIKE',
        name: 'High Transaction Velocity',
        severity: 'high',
        weight: velocityScore
      })
    }
    
    // RULE 8: KYC Inconsistencies
    if (amount > 50000) {
      score += 10
      explanations.push('Large transfer requiring review')
      rulesTriggered.push({
        rule_id: 'KYC_INCONSISTENCY',
        name: 'KYC Review Required',
        severity: 'medium',
        weight: 10
      })
    }
    
    const finalScore = Math.min(score, 100)
    const riskLevel = finalScore >= 70 ? 'SMR' : finalScore >= 40 ? 'EDD' : 'NORMAL'
    
    scorecards.push({
      transaction_id: tx.id,
      policy_score: score,
      ml_score: 0,
      final_score: finalScore,
      risk_level: riskLevel,
      mandatory_flags: flags,
      due_by_ts: null,
      indicators: {},
      rules_triggered: rulesTriggered,
      rationale: explanations.join(' | '),
      austrac_compliance: {
        reporting_required: riskLevel === 'SMR',
        timeframe: riskLevel === 'SMR' ? '3_business_days' : null
      }
    })
  }
  
  return scorecards
}

async function updateNetworkGraph(transactions: any[], supabase: any) {
  const addressMap = new Map<string, { total_volume: number, transaction_count: number, last_seen: string }>()
  const edgeMap = new Map<string, { from: string, to: string, amount: number, count: number, first: string, last: string }>()
  
  for (const tx of transactions) {
    const fromStats = addressMap.get(tx.from_address) || { total_volume: 0, transaction_count: 0, last_seen: tx.timestamp }
    fromStats.total_volume += parseFloat(tx.amount)
    fromStats.transaction_count += 1
    fromStats.last_seen = tx.timestamp
    addressMap.set(tx.from_address, fromStats)
    
    const toStats = addressMap.get(tx.to_address) || { total_volume: 0, transaction_count: 0, last_seen: tx.timestamp }
    toStats.total_volume += parseFloat(tx.amount)
    toStats.transaction_count += 1
    toStats.last_seen = tx.timestamp
    addressMap.set(tx.to_address, toStats)
    
    const edgeKey = `${tx.from_address}->${tx.to_address}`
    const edgeStats = edgeMap.get(edgeKey) || { 
      from: tx.from_address, 
      to: tx.to_address, 
      amount: 0, 
      count: 0, 
      first: tx.timestamp, 
      last: tx.timestamp 
    }
    edgeStats.amount += parseFloat(tx.amount)
    edgeStats.count += 1
    edgeStats.last = tx.timestamp
    edgeMap.set(edgeKey, edgeStats)
  }
  
  const nodes = Array.from(addressMap.entries()).map(([address, stats]) => ({
    address,
    total_volume: stats.total_volume,
    transaction_count: stats.transaction_count,
    last_seen: stats.last_seen
  }))
  
  const edges = Array.from(edgeMap.values()).map(edge => ({
    from_address: edge.from,
    to_address: edge.to,
    total_amount: edge.amount,
    transaction_count: edge.count,
    first_transaction: edge.first,
    last_transaction: edge.last
  }))
  
  if (nodes.length > 0) {
    await supabase.from('network_nodes').upsert(nodes, { onConflict: 'address' })
  }
  
  if (edges.length > 0) {
    await supabase.from('network_edges').upsert(edges, { onConflict: 'from_address,to_address' })
  }
}
