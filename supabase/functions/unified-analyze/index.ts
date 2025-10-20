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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    // Step 2: Analyze each transaction with AUSTRAC scoring
    const scorecards = []
    const analysisResults = []
    
    for (const transaction of storedTransactions) {
      console.log(`📊 Analyzing transaction ${transaction.transaction_id}...`)
      
      // Get customer profile if exists
      const { data: customer } = await supabaseClient
        .from('customer_profiles')
        .select('*')
        .eq('customer_identifier', transaction.from_address)
        .maybeSingle()
      
      // Get transaction history
      const { data: history } = await supabaseClient
        .from('transactions')
        .select('*')
        .or(`from_address.eq.${transaction.from_address},to_address.eq.${transaction.from_address}`)
        .order('timestamp', { ascending: false })
        .limit(100)
      
      // Apply AUSTRAC rules
      const ruleScore = await applyRules(supabaseClient, transaction, customer, history || [])
      
      // Calculate final score
      const finalScore = Math.min(ruleScore.score, 100)
      const riskLevel = getRiskLevel(finalScore, ruleScore.mandatory)
      const dueByTs = calculateDueDate(riskLevel, ruleScore.flags)
      
      // Create scorecard
      const scorecard = {
        transaction_id: transaction.id,
        policy_score: ruleScore.score,
        ml_score: 0,
        final_score: finalScore,
        risk_level: riskLevel,
        mandatory_flags: ruleScore.flags,
        due_by_ts: dueByTs,
        indicators: ruleScore.indicators,
        rules_triggered: ruleScore.rulesTriggered,
        rationale: ruleScore.rationale,
        austrac_compliance: {
          score_breakdown: ruleScore.scoreBreakdown,
          reporting_required: riskLevel === 'SMR',
          timeframe: riskLevel === 'SMR' ? (ruleScore.isTF ? '24_hours' : '3_business_days') : null
        }
      }
      
      scorecards.push(scorecard)
      
      // Create analysis result for compatibility
      // Map AUSTRAC risk levels to analysis_results schema constraint
      const mappedRiskLevel = riskLevel === 'NORMAL' ? 'LOW' 
        : riskLevel === 'EDD' ? 'MEDIUM'
        : riskLevel === 'SMR' ? 'HIGH'
        : 'MEDIUM';
      
      const analysisResult = {
        transaction_id: transaction.id,
        risk_score: finalScore,
        anomaly_detected: ruleScore.rulesTriggered.length > 0,
        anomaly_type: ruleScore.rulesTriggered.map((r: any) => r.rule_id).join(','),
        network_cluster: `cluster_${riskLevel.toLowerCase()}`,
        austrac_score: finalScore,
        general_risk_score: 0,
        risk_level: mappedRiskLevel
      }
      
      analysisResults.push(analysisResult)
      
      console.log(`✅ Transaction ${transaction.transaction_id}: Score=${finalScore}, Level=${riskLevel}`)
    }
    
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

async function applyRules(supabase: any, transaction: any, customer: any, history: any[]) {
  const { data: rules } = await supabase
    .from('rule_catalog')
    .select('*')
    .eq('enabled', true)

  let score = 0
  const flags: string[] = []
  const indicators: any = {}
  const rulesTriggered: any[] = []
  const scoreBreakdown: any = {}
  let rationale = ''
  let isTF = false

  const amount = parseFloat(transaction.amount)

  // Basic AUSTRAC indicators even if no rules match
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

  for (const rule of rules || []) {
    const triggered = await checkRule(rule, transaction, customer, history, supabase)
    
    if (triggered.isTriggered) {
      score += rule.weight
      scoreBreakdown[rule.rule_id] = rule.weight
      
      if (rule.must_report) {
        flags.push(rule.rule_id)
      }
      
      indicators[rule.austrac_indicator || rule.name] = triggered.evidence
      
      rulesTriggered.push({
        rule_id: rule.rule_id,
        name: rule.name,
        severity: rule.severity,
        weight: rule.weight,
        evidence: triggered.evidence,
        austrac_indicator: rule.austrac_indicator
      })
      
      rationale += `${rule.name}: ${triggered.evidence}\n`

      if (rule.rule_id === 'SANCTIONS_HIT' || triggered.evidence.includes('terrorism')) {
        isTF = true
      }
    }
  }

  return {
    score,
    flags,
    indicators,
    rulesTriggered,
    scoreBreakdown,
    rationale: rationale.trim(),
    mandatory: flags.length > 0,
    isTF
  }
}

async function checkRule(rule: any, transaction: any, customer: any, history: any[], supabase: any) {
  const amount = parseFloat(transaction.amount)
  const timestamp = new Date(transaction.timestamp)

  switch (rule.rule_id) {
    case 'STRUCT_CASH': {
      const sevenDaysAgo = new Date(timestamp)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentCash = history.filter((tx: any) => 
        tx.transaction_type === 'cash_deposit' &&
        parseFloat(tx.amount) >= 8000 && parseFloat(tx.amount) < 10000 &&
        new Date(tx.timestamp) >= sevenDaysAgo
      )
      
      if (amount >= 8000 && amount < 10000 && transaction.transaction_type === 'cash_deposit') {
        recentCash.push(transaction)
      }
      
      if (recentCash.length >= 3) {
        return {
          isTriggered: true,
          evidence: `${recentCash.length} cash deposits just below $10,000 threshold within 7 days`
        }
      }
      break
    }

    case 'VELOCITY_SPIKE': {
      const thirtyDaysAgo = new Date(timestamp)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentHistory = history.filter((tx: any) => 
        new Date(tx.timestamp) >= thirtyDaysAgo
      )
      
      if (recentHistory.length > 15) {
        return {
          isTriggered: true,
          evidence: `High transaction frequency: ${recentHistory.length} transactions in 30 days`
        }
      }
      break
    }

    case 'RAPID_MOVEMENT': {
      const sixHoursLater = new Date(timestamp)
      sixHoursLater.setHours(sixHoursLater.getHours() + 6)
      
      const rapidMovement = history.filter((tx: any) =>
        tx.from_address === transaction.to_address &&
        new Date(tx.timestamp) > timestamp &&
        new Date(tx.timestamp) <= sixHoursLater
      )
      
      if (rapidMovement.length > 0) {
        return {
          isTriggered: true,
          evidence: `Rapid fund movement detected within 6 hours`
        }
      }
      break
    }
  }

  return { isTriggered: false, evidence: '' }
}

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
  for (const tx of transactions) {
    await supabase
      .from('network_nodes')
      .upsert([
        {
          address: tx.from_address,
          total_volume: 0,
          transaction_count: 0,
          last_seen: tx.timestamp
        },
        {
          address: tx.to_address,
          total_volume: 0,
          transaction_count: 0,
          last_seen: tx.timestamp
        }
      ], { onConflict: 'address' })

    await supabase
      .from('network_edges')
      .upsert({
        from_address: tx.from_address,
        to_address: tx.to_address,
        total_amount: tx.amount,
        transaction_count: 1,
        first_transaction: tx.timestamp,
        last_transaction: tx.timestamp
      }, { onConflict: 'from_address,to_address' })
  }
}
