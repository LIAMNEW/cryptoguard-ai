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

    switch (type) {
      case 'overview':
        return await getOverviewData(supabaseClient)
      case 'network':
        return await getNetworkData(supabaseClient)
      case 'timeline':
        return await getTimelineData(supabaseClient)
      case 'anomalies':
        return await getAnomaliesData(supabaseClient)
      case 'risk':
        return await getRiskData(supabaseClient)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type parameter' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getOverviewData(supabase: any) {
  const { data: totalTransactions } = await supabase
    .from('transactions')
    .select('count')
    .single()

  const { data: avgRiskScore } = await supabase
    .from('analysis_results')
    .select('risk_score')

  const { data: anomalies } = await supabase
    .from('analysis_results')
    .select('count')
    .eq('anomaly_detected', true)
    .single()

  const { data: highRisk } = await supabase
    .from('analysis_results')
    .select('count')
    .gte('risk_score', 75)
    .single()

  const riskScore = avgRiskScore?.reduce((sum: number, item: any) => sum + item.risk_score, 0) / (avgRiskScore?.length || 1) || 0

  return new Response(
    JSON.stringify({
      totalTransactions: totalTransactions?.count || 0,
      averageRiskScore: Math.round(riskScore),
      anomaliesFound: anomalies?.count || 0,
      highRiskTransactions: highRisk?.count || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getNetworkData(supabase: any) {
  const { data: nodes } = await supabase
    .from('network_nodes')
    .select('*')
    .limit(50)

  const { data: edges } = await supabase
    .from('network_edges')
    .select('*')
    .limit(100)

  const formattedNodes = nodes?.map((node: any) => ({
    id: node.address,
    address: node.address,
    amount: node.total_volume,
    riskLevel: node.risk_level
  })) || []

  const formattedEdges = edges?.map((edge: any) => ({
    source: edge.from_address,
    target: edge.to_address,
    amount: edge.total_amount
  })) || []

  return new Response(
    JSON.stringify({ nodes: formattedNodes, links: formattedEdges }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTimelineData(supabase: any) {
  const { data: timelineData } = await supabase
    .from('transactions')
    .select(`
      timestamp,
      amount,
      analysis_results(risk_score, anomaly_detected)
    `)
    .order('timestamp', { ascending: true })

  const groupedData = timelineData?.reduce((acc: any, tx: any) => {
    const date = new Date(tx.timestamp).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { timestamp: date, volume: 0, riskScore: 0, anomalies: 0, count: 0 }
    }
    acc[date].volume += parseFloat(tx.amount)
    acc[date].riskScore += tx.analysis_results[0]?.risk_score || 0
    acc[date].anomalies += tx.analysis_results[0]?.anomaly_detected ? 1 : 0
    acc[date].count += 1
    return acc
  }, {})

  const timeline = Object.values(groupedData || {}).map((day: any) => ({
    timestamp: day.timestamp,
    volume: day.volume,
    riskScore: Math.round(day.riskScore / day.count),
    anomalies: day.anomalies
  }))

  return new Response(
    JSON.stringify(timeline),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAnomaliesData(supabase: any) {
  const { data: anomalies } = await supabase
    .from('analysis_results')
    .select(`
      *,
      transactions(*)
    `)
    .eq('anomaly_detected', true)
    .order('risk_score', { ascending: false })
    .limit(20)

  const formattedAnomalies = anomalies?.map((anomaly: any) => ({
    id: anomaly.id,
    type: anomaly.anomaly_type,
    severity: anomaly.risk_score >= 75 ? 'High' : anomaly.risk_score >= 50 ? 'Medium' : 'Low',
    description: getAnomalyDescription(anomaly.anomaly_type),
    transaction: anomaly.transactions,
    riskScore: anomaly.risk_score,
    timestamp: anomaly.created_at
  }))

  return new Response(
    JSON.stringify(formattedAnomalies || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getRiskData(supabase: any) {
  const { data: riskDistribution } = await supabase
    .from('analysis_results')
    .select('risk_score')

  const distribution = { low: 0, medium: 0, high: 0, critical: 0 }
  riskDistribution?.forEach((result: any) => {
    const score = result.risk_score
    if (score < 25) distribution.low++
    else if (score < 50) distribution.medium++
    else if (score < 75) distribution.high++
    else distribution.critical++
  })

  return new Response(
    JSON.stringify(distribution),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getAnomalyDescription(type: string): string {
  const descriptions: { [key: string]: string } = {
    'high_value': 'Transaction amount exceeds normal thresholds',
    'rapid_transactions': 'Unusually high transaction frequency detected',
    'circular': 'Circular transaction pattern identified',
    'unusual_timing': 'Transaction occurred during unusual hours'
  }
  
  if (type?.includes(',')) {
    return type.split(',').map(t => descriptions[t] || t).join('; ')
  }
  
  return descriptions[type] || 'Unknown anomaly type'
}