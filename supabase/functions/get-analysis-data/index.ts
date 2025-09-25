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
  const { data: transactions } = await supabase
    .from('transactions')
    .select('count')

  const { data: analysisResults } = await supabase
    .from('analysis_results')
    .select('risk_score, anomaly_detected')

  const totalTransactions = transactions?.[0]?.count || 0
  const avgRiskScore = analysisResults?.length > 0 
    ? Math.round(analysisResults.reduce((sum: number, r: any) => sum + r.risk_score, 0) / analysisResults.length)
    : 0
  const anomaliesFound = analysisResults?.filter((r: any) => r.anomaly_detected).length || 0
  const highRiskTransactions = analysisResults?.filter((r: any) => r.risk_score > 70).length || 0

  return {
    totalTransactions,
    averageRiskScore: avgRiskScore,
    anomaliesFound,
    highRiskTransactions
  }
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
  const { data: transactions } = await supabase
    .from('transactions')
    .select('timestamp, amount')
    .order('timestamp', { ascending: true })

  if (!transactions) return []

  // Group by date
  const grouped = transactions.reduce((acc: any, tx: any) => {
    const date = new Date(tx.timestamp).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { timestamp: date, volume: 0, count: 0 }
    }
    acc[date].volume += parseFloat(tx.amount)
    acc[date].count += 1
    return acc
  }, {})

  return Object.values(grouped).map((day: any) => ({
    timestamp: day.timestamp,
    volume: day.volume,
    riskScore: Math.random() * 100, // Placeholder
    anomalies: Math.floor(Math.random() * 5)
  }))
}

async function getAnomaliesData(supabase: any) {
  const { data: anomalies } = await supabase
    .from('analysis_results')
    .select(`
      *,
      transactions (*)
    `)
    .eq('anomaly_detected', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return anomalies?.map((anomaly: any) => ({
    id: anomaly.id,
    type: anomaly.anomaly_type || 'Unknown',
    severity: anomaly.risk_score > 80 ? 'Critical' : anomaly.risk_score > 60 ? 'High' : 'Medium',
    description: getAnomalyDescription(anomaly.anomaly_type),
    transaction: anomaly.transactions,
    riskScore: anomaly.risk_score,
    timestamp: anomaly.created_at
  })) || []
}

async function getRiskData(supabase: any) {
  const { data: analysisResults } = await supabase
    .from('analysis_results')
    .select('risk_score')

  if (!analysisResults) return { low: 0, medium: 0, high: 0, critical: 0 }

  const distribution = analysisResults.reduce((acc: any, result: any) => {
    const score = result.risk_score
    if (score < 25) acc.low++
    else if (score < 50) acc.medium++
    else if (score < 75) acc.high++
    else acc.critical++
    return acc
  }, { low: 0, medium: 0, high: 0, critical: 0 })

  return distribution
}

function getAnomalyDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'high_value': 'Transaction amount significantly above average',
    'rapid_transactions': 'Unusually high frequency of transactions',
    'circular': 'Circular transaction pattern detected',
    'unusual_timing': 'Transaction occurred at unusual hours'
  }
  return descriptions[type] || 'Anomalous pattern detected'
}