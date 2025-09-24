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
    return new Response(
      JSON.stringify({ error: error.message }),
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

  // Amount-based risk assessment
  if (transaction.amount > 100000) {
    riskScore += 30
    anomalyDetected = true
    anomalyType = 'high_value'
  } else if (transaction.amount > 50000) {
    riskScore += 15
  }

  // Time-based analysis (unusual hours)
  const hour = new Date(transaction.timestamp).getUTCHours()
  if (hour < 6 || hour > 22) {
    riskScore += 10
  }

  // Frequency analysis - check for rapid transactions from same address
  const { data: recentTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('timestamp', { ascending: false })

  if (recentTxs && recentTxs.length > 10) {
    riskScore += 25
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},rapid_transactions` : 'rapid_transactions'
  }

  // Network analysis - check for circular transactions
  const { data: circularCheck } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.to_address)
    .eq('to_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 86400000).toISOString()) // Last 24 hours

  if (circularCheck && circularCheck.length > 0) {
    riskScore += 20
    anomalyDetected = true
    anomalyType = anomalyType ? `${anomalyType},circular` : 'circular'
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100)

  return {
    transaction_id: transaction.id,
    risk_score: riskScore,
    anomaly_detected: anomalyDetected,
    anomaly_type: anomalyType || null,
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