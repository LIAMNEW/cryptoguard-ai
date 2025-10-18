import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { transaction, customer, history } = await req.json()

    console.log(`Scoring transaction ${transaction.transaction_id}...`)

    // Stage A: Rule-Based Scoring (Authoritative)
    const ruleScore = await applyRules(supabaseClient, transaction, customer, history)
    
    // Stage B: ML Scoring (Advisory) - Currently using heuristic, ready for ML model
    const mlScore = await calculateMLScore(transaction, customer, history)
    
    // Combine scores with monotonicity
    const finalScore = combineScores(ruleScore.score, mlScore, ruleScore.mandatory)
    
    // Determine risk level and due dates
    const riskLevel = getRiskLevel(finalScore, ruleScore.mandatory)
    const dueByTs = calculateDueDate(riskLevel, ruleScore.flags)

    // Save scorecard
    const scorecard = {
      transaction_id: transaction.id,
      policy_score: ruleScore.score,
      ml_score: mlScore,
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

    const { data: savedScorecard, error: scorecardError } = await supabaseClient
      .from('transaction_scorecards')
      .insert(scorecard)
      .select()
      .single()

    if (scorecardError) throw scorecardError

    console.log(`Transaction ${transaction.transaction_id}: Score=${finalScore}, Level=${riskLevel}`)

    return new Response(
      JSON.stringify({
        scorecard: savedScorecard,
        recommended_action: riskLevel,
        rules_triggered: ruleScore.rulesTriggered,
        top_features: ruleScore.topFeatures
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error scoring transaction:', errorMessage)
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
  const topFeatures: string[] = []
  let rationale = ''
  let isTF = false

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
      
      topFeatures.push(rule.name)
      rationale += `${rule.name}: ${triggered.evidence}\n`

      // Check if terrorism financing related
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
    topFeatures: topFeatures.slice(0, 5),
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
      // Check for cash deposits just under $10,000 within 7 days
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
          evidence: `${recentCash.length} cash deposits of $${amount.toLocaleString()} within 7 days, just below $10,000 threshold`
        }
      }
      break
    }

    case 'LAYERING': {
      // Check for multiple onward transfers within 48h
      const fortyEightHoursLater = new Date(timestamp)
      fortyEightHoursLater.setHours(fortyEightHoursLater.getHours() + 48)
      
      const recentTransfers = history.filter((tx: any) =>
        tx.from_address === transaction.to_address &&
        new Date(tx.timestamp) > timestamp &&
        new Date(tx.timestamp) <= fortyEightHoursLater &&
        tx.to_address !== transaction.from_address
      )
      
      if (recentTransfers.length >= 2) {
        return {
          isTriggered: true,
          evidence: `${recentTransfers.length} onward transfers to new counterparties within 48 hours of initial deposit`
        }
      }
      break
    }

    case 'HIGH_RISK_GEO': {
      // Check if transaction involves high-risk jurisdiction
      const { data: highRiskCountries } = await supabase
        .from('high_risk_jurisdictions')
        .select('country_code, country_name, risk_category')
        .eq('active', true)
      
      const countryCodes = highRiskCountries?.map((c: any) => c.country_code) || []
      
      // Check origin_country or dest_country from transaction metadata
      const originCountry = transaction.origin_country
      const destCountry = transaction.dest_country
      
      if (countryCodes.includes(originCountry) || countryCodes.includes(destCountry)) {
        const country = highRiskCountries?.find((c: any) => 
          c.country_code === originCountry || c.country_code === destCountry
        )
        return {
          isTriggered: true,
          evidence: `Transaction involves ${country.country_name} (${country.risk_category})`
        }
      }
      break
    }

    case 'SANCTIONS_HIT': {
      // Simulated sanctions check - in production, integrate with sanctions API
      // This is a placeholder - real implementation would check against OFAC, UN, etc.
      const customerName = customer?.kyc_data?.full_name || ''
      const sanctionedTerms = ['sanctioned', 'blocked', 'designated']
      
      if (sanctionedTerms.some(term => customerName.toLowerCase().includes(term))) {
        return {
          isTriggered: true,
          evidence: 'Positive match against sanctions/PEP database'
        }
      }
      break
    }

    case 'VELOCITY_SPIKE': {
      // Calculate baseline transaction frequency and amount
      const thirtyDaysAgo = new Date(timestamp)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentHistory = history.filter((tx: any) => 
        new Date(tx.timestamp) >= thirtyDaysAgo
      )
      
      const avgAmount = recentHistory.length > 0
        ? recentHistory.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / recentHistory.length
        : 0
      
      const txPerDay = recentHistory.length / 30
      
      // Check if current amount is 3x average or frequency spike
      if (amount > avgAmount * 3 || txPerDay > 15) {
        return {
          isTriggered: true,
          evidence: `Amount ${(amount / avgAmount).toFixed(1)}x above baseline or frequency spike detected`
        }
      }
      break
    }

    case 'KYC_MISMATCH': {
      // Check for recent KYC changes
      const lastKycUpdate = customer?.last_kyc_update ? new Date(customer.last_kyc_update) : null
      const thirtyDaysAgo = new Date(timestamp)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      if (lastKycUpdate && lastKycUpdate >= thirtyDaysAgo) {
        const phoneChanges = customer?.kyc_data?.phone_changes || 0
        const addressChanges = customer?.kyc_data?.address_changes || 0
        
        if (phoneChanges > 0 || addressChanges > 0) {
          return {
            isTriggered: true,
            evidence: `Recent KYC changes: ${phoneChanges} phone, ${addressChanges} address updates in last 30 days`
          }
        }
      }
      break
    }

    case 'PROFILE_INCONSISTENT': {
      // Check if transaction inconsistent with customer profile
      const occupation = customer?.occupation || ''
      const incomeBracket = customer?.income_bracket || ''
      
      if (occupation === 'student' && amount > 50000) {
        return {
          isTriggered: true,
          evidence: `Transaction amount inconsistent with declared occupation (${occupation})`
        }
      }
      
      if (incomeBracket === 'low' && amount > 100000) {
        return {
          isTriggered: true,
          evidence: `Large transaction inconsistent with declared income bracket`
        }
      }
      break
    }

    case 'RAPID_MOVEMENT': {
      // Check for rapid fund movement (within hours)
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
          evidence: `Funds moved within ${Math.round((new Date(rapidMovement[0].timestamp).getTime() - timestamp.getTime()) / (1000 * 60 * 60))} hours of deposit`
        }
      }
      break
    }

    case 'CASH_INTENSIVE': {
      // Check for excessive cash activity
      const ninetyDaysAgo = new Date(timestamp)
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      
      const cashTxs = history.filter((tx: any) =>
        tx.transaction_type === 'cash_deposit' &&
        new Date(tx.timestamp) >= ninetyDaysAgo
      )
      
      const totalCash = cashTxs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
      
      if (cashTxs.length > 20 || totalCash > 500000) {
        return {
          isTriggered: true,
          evidence: `${cashTxs.length} cash transactions totaling $${totalCash.toLocaleString()} in 90 days`
        }
      }
      break
    }

    case 'THIRD_PARTY': {
      // Check for third-party transactions
      const thirdPartyTxs = history.filter((tx: any) =>
        tx.from_address !== customer?.customer_identifier &&
        tx.to_address === customer?.customer_identifier
      )
      
      if (thirdPartyTxs.length >= 5) {
        return {
          isTriggered: true,
          evidence: `${thirdPartyTxs.length} third-party deposits detected`
        }
      }
      break
    }
  }

  return { isTriggered: false, evidence: '' }
}

async function calculateMLScore(transaction: any, customer: any, history: any[]) {
  // Placeholder for ML model - currently using heuristic
  // In production, this would call a trained ML model
  
  const features = extractFeatures(transaction, customer, history)
  
  // Simple heuristic scoring - replace with actual ML model
  let mlScore = 0
  
  if (features.amountZScore > 2) mlScore += 0.2
  if (features.frequencyZScore > 2) mlScore += 0.2
  if (features.newCounterparties > 5) mlScore += 0.15
  if (features.crossBorderRatio > 0.5) mlScore += 0.15
  if (features.hourOfDayAnomaly) mlScore += 0.1
  if (features.kycRecentChanges) mlScore += 0.2
  
  return Math.min(mlScore, 1.0)
}

function extractFeatures(transaction: any, customer: any, history: any[]) {
  const amount = parseFloat(transaction.amount)
  
  // Calculate z-scores
  const amounts = history.map((tx: any) => parseFloat(tx.amount))
  const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0
  const stdAmount = amounts.length > 0 ? Math.sqrt(amounts.reduce((sum, x) => sum + Math.pow(x - avgAmount, 2), 0) / amounts.length) : 1
  const amountZScore = stdAmount > 0 ? (amount - avgAmount) / stdAmount : 0
  
  // Frequency analysis
  const thirtyDaysAgo = new Date(transaction.timestamp)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentCount = history.filter((tx: any) => new Date(tx.timestamp) >= thirtyDaysAgo).length
  const avgFrequency = history.length / 90 // assume 90 days of history
  const frequencyZScore = avgFrequency > 0 ? (recentCount / 30 - avgFrequency) / avgFrequency : 0
  
  // Counterparty analysis
  const uniqueCounterparties = new Set(history.map((tx: any) => tx.to_address))
  const newCounterparties = uniqueCounterparties.size
  
  // Cross-border ratio
  const crossBorderTxs = history.filter((tx: any) => 
    tx.origin_country !== tx.dest_country
  ).length
  const crossBorderRatio = history.length > 0 ? crossBorderTxs / history.length : 0
  
  // Hour of day anomaly
  const hour = new Date(transaction.timestamp).getHours()
  const hourOfDayAnomaly = hour < 6 || hour > 22
  
  // KYC changes
  const lastKycUpdate = customer?.last_kyc_update ? new Date(customer.last_kyc_update) : null
  const thirtyDaysAgoDate = new Date()
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30)
  const kycRecentChanges = lastKycUpdate && lastKycUpdate >= thirtyDaysAgoDate
  
  return {
    amountZScore,
    frequencyZScore,
    newCounterparties,
    crossBorderRatio,
    hourOfDayAnomaly,
    kycRecentChanges
  }
}

function combineScores(policyScore: number, mlScore: number, hasMandatoryFlags: boolean) {
  // Monotonicity: higher policy score cannot reduce final score
  // If mandatory flags, automatically high score
  if (hasMandatoryFlags) {
    return Math.max(90, policyScore)
  }
  
  // Combine policy and ML scores with weighting
  const combined = (policyScore * 0.7) + (mlScore * 100 * 0.3)
  
  return Math.min(Math.round(combined), 100)
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
  
  // Check if terrorism financing
  const isTF = flags.some(f => f === 'SANCTIONS_HIT')
  
  if (isTF) {
    // 24 hours for terrorism financing
    now.setHours(now.getHours() + 24)
  } else {
    // 3 business days for other suspicious matters
    let daysAdded = 0
    while (daysAdded < 3) {
      now.setDate(now.getDate() + 1)
      const dayOfWeek = now.getDay()
      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++
      }
    }
  }
  
  return now.toISOString()
}
