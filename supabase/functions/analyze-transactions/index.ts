import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Transaction {
  id: string;
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

interface AnalysisResult {
  transaction_id: string;
  risk_score: number;
  anomaly_detected: boolean;
  anomaly_type?: string;
  network_cluster?: string;
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

    if (req.method === 'POST') {
      const { transactions } = await req.json()
      
      // Store transactions in database
      const { data: storedTransactions, error: insertError } = await supabaseClient
        .from('transactions')
        .insert(transactions)
        .select()

      if (insertError) throw insertError

      // Analyze each transaction
      const analysisResults: AnalysisResult[] = []
      
      for (const transaction of storedTransactions) {
        const analysis = await analyzeTransaction(transaction, supabaseClient)
        analysisResults.push(analysis)
      }

      // Store analysis results
      const { error: analysisError } = await supabaseClient
        .from('analysis_results')
        .insert(analysisResults)

      if (analysisError) throw analysisError

      // Update network graph
      await updateNetworkGraph(storedTransactions, supabaseClient)

      return new Response(
        JSON.stringify({ 
          message: 'Transactions analyzed successfully',
          analyzed_count: analysisResults.length,
          results: analysisResults 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
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

async function analyzeTransaction(transaction: Transaction, supabase: any): Promise<AnalysisResult> {
  // Risk scoring algorithm
  let riskScore = 0
  let anomalyDetected = false
  let anomalyType = ''

  // Get dataset statistics for dynamic thresholds
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount, timestamp')
    .order('created_at', { ascending: false })
    .limit(1000) // Get recent transactions for context

  let avgAmount = 0
  let maxAmount = 0
  if (allTransactions && allTransactions.length > 0) {
    avgAmount = allTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) / allTransactions.length
    maxAmount = Math.max(...allTransactions.map((tx: any) => Number(tx.amount)))
  }

  // Dynamic amount-based risk assessment
  const amountRatio = transaction.amount / (avgAmount || 1000)
  if (amountRatio > 5) { // 5x above average
    riskScore += 40
    anomalyDetected = true
    anomalyType = 'high_value'
  } else if (amountRatio > 3) { // 3x above average
    riskScore += 25
    anomalyDetected = true
    anomalyType = 'unusual_amount'
  } else if (amountRatio > 2) { // 2x above average
    riskScore += 15
  }

  // Round amounts detection (potential structuring)
  const isRoundAmount = transaction.amount % 1000 === 0 && transaction.amount >= 10000
  if (isRoundAmount) {
    riskScore += 10
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},round_amount` : 'round_amount'
  }

  // Time-based analysis (unusual hours)
  const hour = new Date(transaction.timestamp).getUTCHours()
  if (hour < 6 || hour > 22) {
    riskScore += 10
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},unusual_time` : 'unusual_time'
  }

  // Frequency analysis - check for rapid transactions from same address
  const { data: recentTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('timestamp', { ascending: false })

  if (recentTxs && recentTxs.length > 5) {
    riskScore += 30
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},rapid_transactions` : 'rapid_transactions'
  } else if (recentTxs && recentTxs.length > 3) {
    riskScore += 15
  }

  // Network analysis - check for circular transactions
  const { data: circularCheck } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.to_address)
    .eq('to_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 86400000).toISOString()) // Last 24 hours

  if (circularCheck && circularCheck.length > 0) {
    riskScore += 25
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},circular` : 'circular'
  }

  // Chain detection - check for immediate subsequent transactions
  const { data: chainTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.to_address)
    .gte('timestamp', new Date(new Date(transaction.timestamp).getTime() + 60000).toISOString()) // Within 1 minute after
    .lte('timestamp', new Date(new Date(transaction.timestamp).getTime() + 600000).toISOString()) // Within 10 minutes after

  if (chainTxs && chainTxs.length > 2) {
    riskScore += 20
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},chain_transactions` : 'chain_transactions'
  }

  // Velocity analysis - multiple large transactions in short time
  const { data: velocityCheck } = await supabase
    .from('transactions')
    .select('amount')
    .eq('from_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 1800000).toISOString()) // Last 30 minutes
    .gt('amount', avgAmount * 2) // Large transactions only

  if (velocityCheck && velocityCheck.length > 2) {
    riskScore += 25
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},high_velocity` : 'high_velocity'
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100)

  return {
    transaction_id: transaction.id,
    risk_score: riskScore,
    anomaly_detected: anomalyDetected,
    anomaly_type: anomalyType || undefined,
    network_cluster: `cluster_${Math.floor(riskScore / 25) + 1}`
  }
}

async function updateNetworkGraph(transactions: Transaction[], supabase: any) {
  for (const tx of transactions) {
    // Update or create nodes
    await supabase
      .from('network_nodes')
      .upsert([
        {
          address: tx.from_address,
          total_volume: 0, // Will be updated by trigger
          transaction_count: 0,
          last_seen: tx.timestamp
        },
        {
          address: tx.to_address,
          total_volume: 0,
          transaction_count: 0,
          last_seen: tx.timestamp
        }
      ])

    // Update edges
    await supabase
      .from('network_edges')
      .upsert({
        from_address: tx.from_address,
        to_address: tx.to_address,
        total_amount: tx.amount,
        transaction_count: 1,
        first_transaction: tx.timestamp,
        last_transaction: tx.timestamp
      })
  }
}