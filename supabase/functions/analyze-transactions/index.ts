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
  austrac_score?: number;
  general_risk_score?: number;
  risk_level?: string;
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
      
      console.log(`Analyzing ${transactions.length} transactions`)
      
      // Check if transactions already have IDs (already stored)
      const hasIds = transactions.every((tx: any) => tx.id)
      let storedTransactions = transactions
      
      // Only insert if they don't have IDs yet
      if (!hasIds) {
        console.log('Storing transactions in database...')
        const { data, error: insertError } = await supabaseClient
          .from('transactions')
          .insert(transactions)
          .select()

        if (insertError) {
          console.error('Error storing transactions:', insertError)
          throw insertError
        }
        storedTransactions = data
      } else {
        console.log('Transactions already stored, proceeding with analysis...')
      }

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
  // ============ AUSTRAC COMPLIANCE RISK SCORE (0-100%) ============
  let austracScore = 0
  let anomalyDetected = false
  let anomalyType = ''
  const anomalies: string[] = []

  // 1. TRANSACTION AMOUNT (Critical Indicator)
  const amount = Number(transaction.amount)
  if (amount > 100000) {
    austracScore += 40 // Critical
    anomalies.push('critical_amount')
  } else if (amount > 50000) {
    austracScore += 30 // Very High
    anomalies.push('very_high_amount')
  } else if (amount > 10000) {
    austracScore += 20 // High - Reportable threshold
    anomalies.push('high_amount')
  }

  // 2. INTERNATIONAL TRANSFERS (if over $1,000)
  // Note: Would need country data in real implementation
  if (amount > 1000) {
    // In real implementation, check if to_address country is international
    // For now, use address pattern heuristics
    const isInternational = transaction.to_address.startsWith('0x') && transaction.from_address.startsWith('0x')
    if (isInternational && amount > 1000) {
      austracScore += 15
      anomalies.push('international_transfer')
    }
  }

  // 3. HIGH-RISK COUNTRIES (would need geolocation data)
  // Placeholder for future enhancement with real country detection
  // FATF Blacklist: +40, Sanctioned: +35, Tax Havens: +20

  // 4. SUSPICIOUS PATTERNS
  // Round amounts (potential structuring)
  const isRoundAmount = amount % 1000 === 0 && amount >= 5000
  if (isRoundAmount) {
    austracScore += 15
    anomalies.push('round_amount_structuring')
  }

  // Statistically unusual transaction times
  const hour = new Date(transaction.timestamp).getUTCHours()
  
  // Calculate time distribution from historical data
  const { data: hourDistribution } = await supabase
    .from('transactions')
    .select('timestamp')
    .order('created_at', { ascending: false })
    .limit(1000)
  
  if (hourDistribution && hourDistribution.length > 100) {
    // Count transactions per hour
    const hourCounts = new Array(24).fill(0)
    hourDistribution.forEach((tx: any) => {
      const txHour = new Date(tx.timestamp).getUTCHours()
      hourCounts[txHour]++
    })
    
    // Calculate mean and standard deviation of hour distribution
    const meanCount = hourCounts.reduce((a, b) => a + b, 0) / 24
    const variance = hourCounts.reduce((sum, count) => sum + Math.pow(count - meanCount, 2), 0) / 24
    const stdDev = Math.sqrt(variance)
    
    // Only flag if this hour is significantly unusual (2+ std deviations below mean)
    // This means the hour is rarely used in the dataset
    if (stdDev > 0 && hourCounts[hour] < (meanCount - 2 * stdDev) && hourCounts[hour] < 10) {
      austracScore += 10
      anomalies.push('unusual_time')
    }
  }

  // High velocity (many transactions quickly)
  const { data: recentTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('timestamp', { ascending: false })

  if (recentTxs && recentTxs.length > 5) {
    austracScore += 20
    anomalies.push('high_velocity')
  }

  // 5. IDENTITY ISSUES (Placeholder - would need KYC data)
  // Missing verification: +25, Failed checks: +25

  // 6. SUSPICIOUS ACTIVITY
  // Structuring detection - multiple transactions just under reporting threshold
  const { data: structuringCheck } = await supabase
    .from('transactions')
    .select('amount')
    .eq('from_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 86400000).toISOString()) // Last 24 hours
    .gte('amount', 9000)
    .lt('amount', 10000)

  if (structuringCheck && structuringCheck.length >= 3) {
    austracScore += 25
    anomalies.push('structuring_detected')
  }

  // ============ GENERAL BLOCKCHAIN RISK ASSESSMENT (0.0-1.0) ============
  let generalRisk = 0.0

  // Get dataset statistics for dynamic thresholds
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount, timestamp')
    .order('created_at', { ascending: false })
    .limit(1000)

  let avgAmount = 0
  let stdDev = 0
  if (allTransactions && allTransactions.length > 0) {
    avgAmount = allTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) / allTransactions.length
    
    // Calculate standard deviation
    const variance = allTransactions.reduce((sum: number, tx: any) => {
      return sum + Math.pow(Number(tx.amount) - avgAmount, 2)
    }, 0) / allTransactions.length
    stdDev = Math.sqrt(variance)
  }

  // 1. UNUSUAL TRANSACTION AMOUNTS (0.2 points)
  // 3+ standard deviations from average
  if (stdDev > 0 && Math.abs(amount - avgAmount) > (3 * stdDev)) {
    generalRisk += 0.2
    anomalies.push('statistical_anomaly')
  }

  // 2. CIRCULAR TRANSACTIONS (0.15 points)
  const { data: circularCheck } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.to_address)
    .eq('to_address', transaction.from_address)
    .gte('timestamp', new Date(Date.now() - 86400000).toISOString()) // Last 24 hours

  if (circularCheck && circularCheck.length > 0) {
    generalRisk += 0.15
    anomalies.push('circular_transaction')
  }

  // 3. HIGH FREQUENCY TRANSACTIONS (0.25 points)
  if (recentTxs && recentTxs.length > 10) {
    generalRisk += 0.25
    anomalies.push('high_frequency')
  }

  // 4. NEW ADDRESS WITH HIGH VALUE (0.3 points)
  const { data: addressHistory } = await supabase
    .from('transactions')
    .select('*')
    .or(`from_address.eq.${transaction.from_address},to_address.eq.${transaction.from_address}`)
    .order('timestamp', { ascending: true })
    .limit(5)

  const isNewAddress = !addressHistory || addressHistory.length <= 2
  const isHighValue = amount > (avgAmount * 3)
  if (isNewAddress && isHighValue) {
    generalRisk += 0.3
    anomalies.push('new_address_high_value')
  }

  // 5. CHAIN TRANSACTIONS (Network anomaly)
  const { data: chainTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('from_address', transaction.to_address)
    .gte('timestamp', new Date(new Date(transaction.timestamp).getTime() + 60000).toISOString())
    .lte('timestamp', new Date(new Date(transaction.timestamp).getTime() + 600000).toISOString())

  if (chainTxs && chainTxs.length > 2) {
    generalRisk += 0.2
    anomalies.push('chain_transaction')
  }

  // Cap general risk at 1.0
  generalRisk = Math.min(generalRisk, 1.0)

  // ============ COMBINED RISK SCORE ============
  // Primary score is AUSTRAC (0-100), General Risk provides additional context
  austracScore = Math.min(austracScore, 100)
  
  // Determine final risk score (use AUSTRAC as primary)
  const finalRiskScore = austracScore
  
  // Determine risk level
  let riskLevel = ''
  if (finalRiskScore >= 80) {
    riskLevel = 'CRITICAL'
  } else if (finalRiskScore >= 60) {
    riskLevel = 'VERY_HIGH'
  } else if (finalRiskScore >= 40) {
    riskLevel = 'HIGH'
  } else if (finalRiskScore >= 20) {
    riskLevel = 'MEDIUM'
  } else {
    riskLevel = 'LOW'
  }

  // Mark as anomaly if any risk detected
  anomalyDetected = anomalies.length > 0
  anomalyType = anomalies.join(',')

  console.log(`Transaction ${transaction.transaction_id}: AUSTRAC=${austracScore}%, General=${(generalRisk * 100).toFixed(1)}%, Level=${riskLevel}`)

  return {
    transaction_id: transaction.id,
    risk_score: finalRiskScore,
    anomaly_detected: anomalyDetected,
    anomaly_type: anomalyType || undefined,
    network_cluster: `cluster_${riskLevel.toLowerCase()}`,
    austrac_score: austracScore,
    general_risk_score: Math.round(generalRisk * 100),
    risk_level: riskLevel
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