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

    const { transaction_id } = await req.json()

    console.log(`Generating SMR draft for transaction ${transaction_id}...`)

    // Get transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single()

    if (txError) throw txError

    // Get scorecard
    const { data: scorecard, error: scorecardError } = await supabaseClient
      .from('transaction_scorecards')
      .select('*')
      .eq('transaction_id', transaction_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (scorecardError) throw scorecardError

    // Get customer profile if available
    const { data: customer } = await supabaseClient
      .from('customer_profiles')
      .select('*')
      .eq('customer_identifier', transaction.from_address)
      .single()

    // Generate SMR narrative using AUSTRAC guidelines
    const smrPayload = generateSMRNarrative(transaction, scorecard, customer)

    // Save draft
    const { data: draft, error: draftError } = await supabaseClient
      .from('smr_drafts')
      .insert({
        transaction_id,
        scorecard_id: scorecard.id,
        payload: smrPayload,
        crime_type: determineCrimeType(scorecard),
        suspicion_description: smrPayload.suspicion,
        customer_profile: smrPayload.customer_profile,
        unusual_activity: smrPayload.unusual_activity,
        analysis_conclusion: smrPayload.analysis,
        due_by_ts: scorecard.due_by_ts,
        status: 'DRAFT'
      })
      .select()
      .single()

    if (draftError) throw draftError

    console.log(`SMR draft generated: ${draft.id}`)

    return new Response(
      JSON.stringify(draft),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error generating SMR:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateSMRNarrative(transaction: any, scorecard: any, customer: any) {
  const amount = parseFloat(transaction.amount)
  const timestamp = new Date(transaction.timestamp)
  
  // WHO
  const customerIdentifier = customer?.customer_identifier || transaction.from_address
  const customerName = customer?.kyc_data?.full_name || 'Unknown'
  const occupation = customer?.occupation || 'Not declared'
  
  // WHAT
  const transactionType = transaction.transaction_type || 'transfer'
  const triggeredRules = scorecard.rules_triggered || []
  const indicators = Object.keys(scorecard.indicators || {})
  
  // WHERE
  const originCountry = transaction.origin_country || 'Unknown'
  const destCountry = transaction.dest_country || 'Unknown'
  
  // WHEN
  const formattedDate = timestamp.toLocaleDateString('en-AU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  // WHY - Grounds for suspicion
  const suspicionReasons = triggeredRules.map((rule: any) => rule.evidence).join('. ')
  
  // HOW - Pattern description
  const patternDescription = describePattern(scorecard, transaction)
  
  // Build narrative sections following AUSTRAC good examples
  
  const suspicion = `This report concerns suspicious transactions conducted by ${customerName} (${customerIdentifier}) that exhibit characteristics consistent with money laundering. ${suspicionReasons}. The pattern of activity demonstrates ${indicators.join(', ')} which are indicators of potential criminal proceeds being laundered through the financial system.`
  
  const customerProfile = `Customer Profile:
The account holder is identified as ${customerName}, occupation listed as ${occupation}.
Customer identifier: ${customerIdentifier}
${customer?.addresses?.length > 0 ? `Address: ${customer.addresses[0]}` : 'Address: Not available'}
${customer?.kyc_data?.identification_type ? `Identification: ${customer.kyc_data.identification_type}` : ''}
${customer?.risk_rating ? `Risk rating: ${customer.risk_rating}` : ''}
${customer?.prior_alerts_count > 0 ? `Previous alerts: ${customer.prior_alerts_count}` : ''}`
  
  const accountDetails = `Transaction Details:
Transaction ID: ${transaction.transaction_id}
Date and time: ${formattedDate}
Amount: $${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
Transaction type: ${transactionType}
Origin: ${originCountry}
Destination: ${destCountry}
Channel: ${transaction.channel || 'Not specified'}`
  
  const unusualActivity = `Unusual Activity Observed:
${patternDescription}

The following AUSTRAC indicators were identified:
${indicators.map((ind, i) => `${i + 1}. ${ind}`).join('\n')}

Risk Assessment:
Policy-based risk score: ${scorecard.policy_score}/100
Final risk score: ${scorecard.final_score}/100
Risk level: ${scorecard.risk_level}
${scorecard.mandatory_flags?.length > 0 ? `Critical flags: ${scorecard.mandatory_flags.join(', ')}` : ''}`
  
  const analysis = `Analysis and Conclusion:
${scorecard.rationale}

Based on the analysis of the transaction patterns, amounts, timing, and customer profile, there are reasonable grounds to suspect that this activity relates to money laundering${scorecard.mandatory_flags?.includes('SANCTIONS_HIT') ? ' and/or terrorism financing' : ''}.

The activity is inconsistent with normal customer behavior and exhibits multiple characteristics outlined in AUSTRAC's money laundering indicators. The combination of ${triggeredRules.length} triggered compliance rules with a final risk score of ${scorecard.final_score}/100 indicates significant concern.

${scorecard.due_by_ts ? `This report must be submitted by: ${new Date(scorecard.due_by_ts).toLocaleString('en-AU')} (${scorecard.austrac_compliance?.timeframe === '24_hours' ? '24-hour terrorism financing timeframe' : '3 business day timeframe'})` : ''}`
  
  return {
    who: customerName,
    what: `${transactionType} of $${amount.toLocaleString()}`,
    where: `${originCountry} to ${destCountry}`,
    when: formattedDate,
    why: suspicionReasons,
    how: patternDescription,
    suspicion,
    customer_profile: customerProfile,
    account_details: accountDetails,
    unusual_activity: unusualActivity,
    analysis,
    compliance_metadata: {
      risk_score: scorecard.final_score,
      risk_level: scorecard.risk_level,
      indicators: indicators,
      rules_triggered: triggeredRules.length,
      due_by: scorecard.due_by_ts,
      timeframe: scorecard.austrac_compliance?.timeframe
    }
  }
}

function determineCrimeType(scorecard: any): string {
  const flags = scorecard.mandatory_flags || []
  const indicators = Object.keys(scorecard.indicators || {})
  
  if (flags.includes('SANCTIONS_HIT')) {
    return 'Terrorism Financing'
  }
  
  if (indicators.some((ind: string) => ind.toLowerCase().includes('structuring'))) {
    return 'Money Laundering - Structuring'
  }
  
  if (indicators.some((ind: string) => ind.toLowerCase().includes('layering'))) {
    return 'Money Laundering - Layering'
  }
  
  return 'Money Laundering'
}

function describePattern(scorecard: any, transaction: any): string {
  const rules = scorecard.rules_triggered || []
  
  if (rules.length === 0) {
    return 'No specific pattern detected.'
  }
  
  const descriptions: string[] = []
  
  for (const rule of rules) {
    switch (rule.rule_id) {
      case 'STRUCT_CASH':
        descriptions.push('Multiple cash deposits structured to avoid reporting thresholds, with individual transactions consistently just below $10,000')
        break
      case 'LAYERING':
        descriptions.push('Rapid movement of funds through multiple accounts in a layering pattern designed to obscure the origin of funds')
        break
      case 'HIGH_RISK_GEO':
        descriptions.push('Transactions involving high-risk jurisdictions known for money laundering or terrorist financing concerns')
        break
      case 'SANCTIONS_HIT':
        descriptions.push('Positive match against sanctions or politically exposed persons databases')
        break
      case 'VELOCITY_SPIKE':
        descriptions.push('Significant deviation from established transaction patterns, with volume and frequency well above historical norms')
        break
      case 'KYC_MISMATCH':
        descriptions.push('Recent changes to customer identification documents and contact information raising verification concerns')
        break
      case 'PROFILE_INCONSISTENT':
        descriptions.push('Transaction amounts and patterns inconsistent with declared occupation, income, and business purpose')
        break
      case 'RAPID_MOVEMENT':
        descriptions.push('Funds deposited and immediately moved to external accounts within hours, suggesting pass-through activity')
        break
      case 'CASH_INTENSIVE':
        descriptions.push('Unusually high volume of cash transactions inconsistent with stated business activities')
        break
      case 'THIRD_PARTY':
        descriptions.push('Multiple third-party deposits from unknown sources')
        break
    }
  }
  
  const chronological = `Transaction sequence began on ${new Date(transaction.timestamp).toLocaleDateString('en-AU')}. ${descriptions.join('. ')}.`
  
  return chronological
}
