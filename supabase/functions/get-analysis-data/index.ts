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
  // Get total transaction count
  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  // Get ALL analysis results for accurate average risk score
  const { data: allAnalysis } = await supabase
    .from('analysis_results')
    .select('risk_score')

  console.log(`📊 Total transactions: ${totalTransactions}, Analysis results: ${allAnalysis?.length || 0}`)

  // Get total counts for anomalies and high risk transactions
  const { count: totalAnomalies } = await supabase
    .from('analysis_results')
    .select('*', { count: 'exact', head: true })
    .eq('anomaly_detected', true)

  const { count: totalHighRisk } = await supabase
    .from('analysis_results')
    .select('*', { count: 'exact', head: true })
    .gt('risk_score', 70)

  const avgRiskScore = allAnalysis?.length > 0 
    ? Math.round(allAnalysis.reduce((sum: number, r: any) => sum + r.risk_score, 0) / allAnalysis.length)
    : 0

  console.log(`📈 Avg Risk Score: ${avgRiskScore}, Anomalies: ${totalAnomalies}, High Risk: ${totalHighRisk}`)

  return {
    totalTransactions: totalTransactions || 0,
    averageRiskScore: avgRiskScore,
    anomaliesFound: totalAnomalies || 0,
    highRiskTransactions: totalHighRisk || 0
  }
}

async function getNetworkData(supabase: any) {
  // Fetch ALL network nodes (removed limit)
  const { data: nodes } = await supabase
    .from('network_nodes')
    .select('*')
    .order('total_volume', { ascending: false })

  // Fetch ALL network edges (removed limit)
  const { data: edges } = await supabase
    .from('network_edges')
    .select('*')
    .order('total_amount', { ascending: false })

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
  // Fetch ALL transactions for timeline (removed any implicit limits)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('timestamp, amount')
    .order('timestamp', { ascending: true })

  console.log(`📅 Timeline data: ${transactions?.length || 0} transactions`)

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
  // Fetch ALL anomalies (removed 20 limit for full dataset)
  const { data: anomalies } = await supabase
    .from('analysis_results')
    .select(`
      *,
      transactions (*)
    `)
    .eq('anomaly_detected', true)
    .order('created_at', { ascending: false })

  console.log(`🚨 Anomalies found: ${anomalies?.length || 0}`)

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
  // Fetch ALL analysis results for risk distribution
  const { data: analysisResults } = await supabase
    .from('analysis_results')
    .select('risk_score')

  console.log(`⚠️ Risk data from ${analysisResults?.length || 0} analysis results`)

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