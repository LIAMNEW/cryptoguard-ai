import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AUSTRACTransaction {
  TransactionID: string;
  Date: string;
  Time?: string;
  Type: string;
  Amount: number;
  Merchant: string;
  Country: string;
  Channel: string;
  Counterparty?: string;
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
    
    console.log(`📊 Analyzing ${transactions.length} AUSTRAC transactions`)
    
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions provided')
    }
    
    // High-risk countries from AUSTRAC training
    const HIGH_RISK_COUNTRIES = new Set([
      'Iran', 'Myanmar', 'Democratic People\'s Republic of Korea', 'DPRK',
      'Bolivia', 'British Virgin Islands', 'UAE', 'Singapore', 'Hong Kong'
    ])
    
    // Suspicious keywords from AUSTRAC training
    const SUSPICIOUS_KEYWORDS = [
      'remit', 'offshore', 'fastfunds', 'remithub', 'phantom',
      'fake', 'crypto', 'gold brokers', 'investment', 'w00l', 'uber-oceanic'
    ]
    
    const results = []
    const scorecards = []
    
    for (const tx of transactions as AUSTRACTransaction[]) {
      let score = 0
      const reasons: string[] = []
      const flags: string[] = []
      const rulesTriggered: any[] = []
      
      const amount = parseFloat(tx.Amount.toString())
      const country = (tx.Country || 'Australia').trim()
      const merchant = (tx.Merchant || '').toLowerCase()
      const channel = (tx.Channel || '').toLowerCase()
      const type = (tx.Type || '').toLowerCase()
      const counterparty = tx.Counterparty?.trim() || ''
      
      // Factor 1: High-risk or foreign country (+1)
      if (HIGH_RISK_COUNTRIES.has(country)) {
        score += 1
        reasons.push(`High-risk country: ${country}`)
        flags.push('HIGH_RISK_JURISDICTION')
        rulesTriggered.push({
          rule_id: 'HIGH_RISK_COUNTRY',
          name: 'High-Risk Jurisdiction',
          severity: 'high',
          weight: 1
        })
      } else if (country !== 'Australia') {
        score += 1
        reasons.push(`Foreign transaction: ${country}`)
        rulesTriggered.push({
          rule_id: 'FOREIGN_TRANSACTION',
          name: 'Foreign Transaction',
          severity: 'medium',
          weight: 1
        })
      }
      
      // Factor 2: Large transaction (≥$15,000) (+1)
      if (amount >= 15000) {
        score += 1
        reasons.push(`Large transaction: $${amount.toLocaleString()}`)
        rulesTriggered.push({
          rule_id: 'LARGE_TRANSACTION',
          name: 'Large Transaction',
          severity: 'high',
          weight: 1
        })
      }
      
      // Factor 3: Structuring ($9,000-$9,999) (+1)
      if (amount >= 9000 && amount < 10000) {
        score += 1
        reasons.push('Structuring pattern detected')
        flags.push('STRUCTURING_SUSPECTED')
        rulesTriggered.push({
          rule_id: 'STRUCTURING',
          name: 'Structuring Pattern',
          severity: 'critical',
          weight: 1
        })
      }
      
      // Factor 4: Suspicious merchant (+1)
      let suspiciousFound = false
      for (const keyword of SUSPICIOUS_KEYWORDS) {
        if (merchant.includes(keyword)) {
          score += 1
          reasons.push(`Suspicious merchant: contains "${keyword}"`)
          flags.push('SUSPICIOUS_MERCHANT')
          rulesTriggered.push({
            rule_id: 'SUSPICIOUS_MERCHANT',
            name: 'Suspicious Merchant',
            severity: 'high',
            weight: 1
          })
          suspiciousFound = true
          break
        }
      }
      
      // Factor 5: High-risk channel (+1)
      if (channel.includes('wire') || channel.includes('atm')) {
        score += 1
        reasons.push(`High-risk channel: ${channel}`)
        rulesTriggered.push({
          rule_id: 'HIGH_RISK_CHANNEL',
          name: 'High-Risk Channel',
          severity: 'medium',
          weight: 1
        })
      }
      
      // Factor 6: Missing counterparty (+1)
      if (type.includes('transfer') && !counterparty) {
        score += 1
        reasons.push('Transfer without counterparty')
        rulesTriggered.push({
          rule_id: 'MISSING_COUNTERPARTY',
          name: 'Missing Counterparty',
          severity: 'medium',
          weight: 1
        })
      }
      
      // Calculate risk level
      let riskLevel: string
      if (score >= 4) {
        riskLevel = 'HIGH'
      } else if (score >= 2) {
        riskLevel = 'MEDIUM'
      } else {
        riskLevel = 'LOW'
      }
      
      // Convert to 0-100 scale (6 factors max)
      const finalScore = Math.min(Math.round((score / 6) * 100), 100)
      
      // Prepare transaction for database
      const timestamp = tx.Time 
        ? `${tx.Date} ${tx.Time}` 
        : `${tx.Date} 00:00:00`
      
      const dbTransaction = {
        transaction_id: tx.TransactionID,
        from_address: tx.TransactionID.split('-')[0] || 'customer',
        to_address: tx.Merchant || 'merchant',
        amount,
        timestamp,
        transaction_type: tx.Type || 'transfer',
        currency: 'AUD'
      }
      
      results.push(dbTransaction)
      
      scorecards.push({
        transaction_id: null, // Will be set after insert
        policy_score: score,
        ml_score: 0,
        final_score: finalScore,
        risk_level: riskLevel,
        mandatory_flags: flags,
        due_by_ts: null,
        indicators: {
          amount,
          country,
          merchant: tx.Merchant,
          channel,
          type
        },
        rules_triggered: rulesTriggered,
        rationale: reasons.length > 0 ? reasons.join(' | ') : 'No risk indicators',
        austrac_compliance: {
          reporting_required: riskLevel === 'HIGH',
          timeframe: riskLevel === 'HIGH' ? '3_business_days' : null,
          risk_class: riskLevel
        }
      })
    }
    
    console.log(`💾 Inserting ${results.length} transactions into database`)
    
    // Insert transactions
    const { data: insertedTxs, error: insertError } = await supabaseClient
      .from('transactions')
      .upsert(results, { 
        onConflict: 'transaction_id',
        ignoreDuplicates: false 
      })
      .select()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to insert: ${insertError.message}`)
    }
    
    // Link scorecards to inserted transactions
    const txMap = new Map(insertedTxs?.map(tx => [tx.transaction_id, tx.id]))
    scorecards.forEach(sc => {
      sc.transaction_id = txMap.get(results[scorecards.indexOf(sc)].transaction_id)
    })
    
    // Insert scorecards
    const { error: scorecardError } = await supabaseClient
      .from('transaction_scorecards')
      .insert(scorecards.filter(sc => sc.transaction_id))
    
    if (scorecardError) {
      console.error('Scorecard error:', scorecardError)
    }
    
    // Insert analysis results
    const analysisResults = scorecards.map(sc => ({
      transaction_id: sc.transaction_id,
      risk_score: sc.final_score,
      anomaly_detected: sc.risk_level === 'HIGH',
      anomaly_type: sc.mandatory_flags.join(','),
      network_cluster: `cluster_${sc.risk_level.toLowerCase()}`,
      austrac_score: sc.final_score,
      general_risk_score: 0,
      risk_level: sc.risk_level
    })).filter(ar => ar.transaction_id)
    
    await supabaseClient
      .from('analysis_results')
      .insert(analysisResults)
    
    const highRiskCount = scorecards.filter(s => s.risk_level === 'HIGH').length
    const avgScore = scorecards.reduce((sum, s) => sum + s.final_score, 0) / scorecards.length
    
    console.log(`✅ Complete: ${highRiskCount} high-risk, avg score ${avgScore.toFixed(1)}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        total_transactions: scorecards.length,
        high_risk_count: highRiskCount,
        medium_risk_count: scorecards.filter(s => s.risk_level === 'MEDIUM').length,
        low_risk_count: scorecards.filter(s => s.risk_level === 'LOW').length,
        average_risk_score: avgScore
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Analysis error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
