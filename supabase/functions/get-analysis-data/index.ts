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

    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    let data
    switch (type) {
      case 'overview':
        data = await getOverviewData(supabaseClient)
        break
      case 'network':
        data = await getNetworkData(supabaseClient)
        break
      case 'timeline':
        data = await getTimelineData(supabaseClient)
        break
      case 'anomalies':
        data = await getAnomaliesData(supabaseClient)
        break
      case 'risk':
        data = await getRiskData(supabaseClient)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type parameter' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function getOverviewData(supabase: any) {
  // Get ALL scorecards for accurate metrics - this is our source of truth
  const { data: allScorecards } = await supabase
    .from('transaction_scorecards')
    .select('final_score, risk_level')

  // Total transactions = those that have been analyzed (have scorecards)
  const totalAnalyzed = allScorecards?.length || 0

  // Calculate average risk score from scorecards if available
  const avgRiskScore = allScorecards && allScorecards.length > 0 
    ? Math.round(allScorecards.reduce((sum: number, s: any) => sum + s.final_score, 0) / allScorecards.length)
    : 0

  // Count high-risk transactions (SMR level)
  const highRiskCount = allScorecards?.filter((s: any) => s.risk_level === 'SMR').length || 0

  // Count medium risk (EDD level)
  const mediumRiskCount = allScorecards?.filter((s: any) => s.risk_level === 'EDD').length || 0

  // Count anomalies (SMR + EDD)
  const totalAnomalies = highRiskCount + mediumRiskCount

  console.log('Overview Data:', {
    totalAnalyzed,
    avgRiskScore,
    highRiskCount,
    mediumRiskCount,
    totalAnomalies,
    scorecardCount: allScorecards?.length
  })

  return {
    totalTransactions: totalAnalyzed,
    averageRiskScore: avgRiskScore,
    anomaliesFound: totalAnomalies,
    highRiskTransactions: highRiskCount
  }
}

async function getNetworkData(supabase: any) {
  const { data: nodes } = await supabase
    .from('network_nodes')
    .select('*')
    .limit(200) // Increased to show more nodes

  const { data: edges } = await supabase
    .from('network_edges')
    .select('*')
    .limit(500) // Increased to show more connections

  const formattedNodes = nodes?.map((node: any) => ({
    id: node.address,
    address: node.address.substring(0, 8) + '...',
    amount: parseFloat(node.total_volume),
    riskLevel: node.risk_level
  })) || []

  const formattedLinks = edges?.map((edge: any) => ({
    source: edge.from_address,
    target: edge.to_address,
    amount: parseFloat(edge.total_amount)
  })) || []

  return {
    nodes: formattedNodes,
    links: formattedLinks
  }
}

async function getTimelineData(supabase: any) {
  // Join transactions with scorecards to get actual risk scores
  const { data: transactionsWithScores } = await supabase
    .from('transactions')
    .select(`
      timestamp,
      amount,
      transaction_scorecards (
        final_score,
        risk_level
      )
    `)
    .order('timestamp', { ascending: true })
    .limit(10000)

  if (!transactionsWithScores) return []

  // Group by date with actual risk scores
  const grouped = transactionsWithScores.reduce((acc: any, tx: any) => {
    const date = new Date(tx.timestamp).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { 
        timestamp: date, 
        volume: 0, 
        count: 0,
        totalRiskScore: 0,
        riskCount: 0,
        anomalies: 0
      }
    }
    acc[date].volume += parseFloat(tx.amount)
    acc[date].count += 1
    
    // Add actual risk scores if available
    if (tx.transaction_scorecards && tx.transaction_scorecards.length > 0) {
      const scorecard = tx.transaction_scorecards[0]
      acc[date].totalRiskScore += scorecard.final_score
      acc[date].riskCount += 1
      if (scorecard.risk_level === 'SMR' || scorecard.risk_level === 'EDD') {
        acc[date].anomalies += 1
      }
    }
    return acc
  }, {})

  return Object.values(grouped).map((day: any) => ({
    timestamp: day.timestamp,
    volume: day.volume,
    riskScore: day.riskCount > 0 ? Math.round(day.totalRiskScore / day.riskCount) : 0,
    anomalies: day.anomalies
  }))
}

async function getAnomaliesData(supabase: any) {
  // Join scorecards with transactions to get comprehensive anomaly data
  const { data: scorecards } = await supabase
    .from('transaction_scorecards')
    .select(`
      *,
      transactions!inner (*)
    `)
    .or('risk_level.eq.SMR,risk_level.eq.EDD')
    .order('created_at', { ascending: false })
    .limit(20)

  return scorecards?.map((scorecard: any) => {
    const topRule = scorecard.rules_triggered?.[0]
    const anomalyType = topRule?.rule_id || scorecard.risk_level
    
    return {
      id: scorecard.id,
      type: anomalyType,
      severity: scorecard.risk_level === 'SMR' ? 'Critical' : 'High',
      description: topRule?.name || `${scorecard.risk_level} risk transaction`,
      evidence: topRule?.evidence || scorecard.rationale,
      transaction: scorecard.transactions,
      riskScore: scorecard.final_score,
      austracScore: scorecard.policy_score,
      timestamp: scorecard.created_at,
      indicators: scorecard.indicators,
      rules: scorecard.rules_triggered
    }
  }) || []
}

async function getRiskData(supabase: any) {
  const { data: scorecards } = await supabase
    .from('transaction_scorecards')
    .select('risk_level, final_score')

  if (!scorecards) return { low: 0, medium: 0, high: 0, critical: 0 }

  const distribution = scorecards.reduce((acc: any, scorecard: any) => {
    const level = scorecard.risk_level
    if (level === 'NORMAL') acc.low++
    else if (level === 'EDD') acc.medium++
    else if (level === 'SMR') acc.high++
    return acc
  }, { low: 0, medium: 0, high: 0, critical: 0 })

  return distribution
}

function getAnomalyDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'STRUCT_CASH': 'Potential structuring - multiple transactions below reporting threshold',
    'VELOCITY_SPIKE': 'Unusually high transaction frequency detected',
    'RAPID_MOVEMENT': 'Rapid fund movement indicating possible layering',
    'HIGH_VALUE': 'Transaction exceeds high-value threshold',
    'LAYERING': 'Complex layering pattern detected',
    'HIGH_RISK_GEO': 'Transaction involves high-risk jurisdiction',
    'high_value': 'Transaction amount significantly above average',
    'rapid_transactions': 'Unusually high frequency of transactions',
    'circular': 'Circular transaction pattern detected',
    'unusual_timing': 'Transaction occurred at unusual hours'
  }
  return descriptions[type] || 'Anomalous pattern detected'
}