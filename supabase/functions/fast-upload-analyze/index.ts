import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Transaction {
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  transaction_type?: string;
  currency?: string;
  merchant?: string;
  location?: string;
  channel?: string;
  notes?: string;
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

    const { fileContent, fileName } = await req.json()
    
    console.log(`🚀 Fast upload: ${fileName} (${fileContent.length} bytes)`)
    
    // Parse based on file type
    let transactions: Transaction[] = []
    const fileExt = fileName.toLowerCase().split('.').pop()
    
    if (fileExt === 'csv') {
      transactions = parseCSV(fileContent)
    } else if (fileExt === 'json') {
      transactions = parseJSON(fileContent)
    } else {
      throw new Error('Unsupported file format. Use CSV or JSON.')
    }
    
    console.log(`📊 Parsed ${transactions.length} transactions`)
    
    if (transactions.length === 0) {
      throw new Error('No valid transactions found in file')
    }
    
    // Clean and validate transactions for database (only include columns that exist in DB)
    const cleanedTransactions = transactions.map((tx, idx) => ({
      transaction_id: tx.transaction_id || `tx_${Date.now()}_${idx}`,
      from_address: tx.from_address || 'unknown',
      to_address: tx.to_address || 'unknown',
      amount: parseFloat(String(tx.amount)) || 0,
      timestamp: tx.timestamp || new Date().toISOString(),
      transaction_type: tx.transaction_type || 'transfer',
      currency: tx.currency || 'AUD'
    }))
    
    // Keep full transaction data with extra fields for risk analysis
    const transactionsWithMetadata = transactions.map((tx, idx) => ({
      ...cleanedTransactions[idx],
      merchant: tx.merchant,
      location: tx.location,
      channel: tx.channel,
      notes: tx.notes
    }))
    
    // Bulk insert transactions
    console.log('💾 Bulk inserting transactions...')
    const { data: insertedTxs, error: insertError } = await supabaseClient
      .from('transactions')
      .upsert(cleanedTransactions, { 
        onConflict: 'transaction_id',
        ignoreDuplicates: false 
      })
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to insert transactions: ${insertError.message}`)
    }

    const storedTxs = insertedTxs || cleanedTransactions
    console.log(`✅ Stored ${storedTxs.length} transactions`)
    
    // Fast batch AUSTRAC scoring using transactions with metadata
    console.log('⚡ Running fast AUSTRAC analysis...')
    const scorecards = await fastAUSTRACAnalysis(transactionsWithMetadata, supabaseClient)
    
    // Bulk insert scorecards
    const { error: scorecardError } = await supabaseClient
      .from('transaction_scorecards')
      .insert(scorecards)
    
    if (scorecardError) {
      console.error('Scorecard error:', scorecardError)
    }
    
    // Insert analysis results for compatibility
    const analysisResults = scorecards.map(sc => ({
      transaction_id: sc.transaction_id,
      risk_score: sc.final_score,
      anomaly_detected: sc.risk_level === 'HIGH',
      anomaly_type: sc.mandatory_flags.join(','),
      network_cluster: `cluster_${sc.risk_level.toLowerCase()}`,
      austrac_score: sc.final_score,
      general_risk_score: 0,
      risk_level: sc.risk_level
    }))
    
    await supabaseClient
      .from('analysis_results')
      .insert(analysisResults)
    
    // Update network graph using cleaned transactions (DB columns only)
    await updateNetworkGraph(storedTxs, supabaseClient)
    
    const highRiskCount = scorecards.filter(s => s.risk_level === 'HIGH').length
    const avgScore = scorecards.reduce((sum, s) => sum + s.final_score, 0) / scorecards.length
    
    console.log(`🎉 Complete: ${scorecards.length} analyzed, ${highRiskCount} high-risk, avg score ${avgScore.toFixed(1)}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        total_transactions: scorecards.length,
        new_transactions: scorecards.length,
        duplicates: 0,
        high_risk_count: highRiskCount,
        average_risk_score: avgScore,
        processing_time_ms: Date.now()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Fast upload error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const transactions: Transaction[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
    const tx: any = {}
    
    headers.forEach((header, idx) => {
      tx[header] = values[idx]
    })
    
    // Map common column names with support for AUSTRAC training format
    transactions.push({
      transaction_id: tx.transaction_id || tx.transactionid || tx.id || tx.txn_id || `tx_${i}`,
      from_address: tx.from_address || tx.from || tx.sender || tx.source || tx.customerid || tx.customer_id || 'unknown',
      to_address: tx.to_address || tx.to || tx.recipient || tx.destination || tx.counterparty || tx.merchantname || tx.merchant || 'unknown',
      amount: parseFloat(tx.amount || tx.amountaud || tx.value || '0'),
      timestamp: tx.timestamp || tx.date || tx.time || new Date().toISOString(),
      transaction_type: tx.transaction_type || tx.transactiontype || tx.type || 'transfer',
      currency: tx.currency || 'AUD',
      // Additional fields for enhanced risk analysis
      merchant: tx.merchantname || tx.merchant || tx.to_address || tx.to,
      location: tx.location || tx.country || 'Australia',
      channel: tx.channel || 'online',
      notes: tx.notes || ''
    })
  }
  
  return transactions
}

function parseJSON(content: string): Transaction[] {
  const data = JSON.parse(content)
  const array = Array.isArray(data) ? data : [data]
  
  return array.map((item, idx) => ({
    transaction_id: item.transaction_id || item.id || item.txn_id || `tx_${idx}`,
    from_address: item.from_address || item.from || item.sender || 'unknown',
    to_address: item.to_address || item.to || item.recipient || 'unknown',
    amount: parseFloat(String(item.amount || item.value || 0)),
    timestamp: item.timestamp || item.date || new Date().toISOString(),
    transaction_type: item.transaction_type || item.type || 'transfer',
    currency: item.currency || 'AUD'
  }))
}

async function fastAUSTRACAnalysis(transactions: any[], supabase: any) {
  const scorecards = []
  
  // High-risk countries from AUSTRAC training data
  const HIGH_RISK_COUNTRIES = new Set([
    'Iran', 'Myanmar', 'Democratic People\'s Republic of Korea', 'DPRK',
    'Bolivia', 'British Virgin Islands', 'UAE', 'London', 'Hong Kong'
  ])
  
  // Suspicious merchant keywords from AUSTRAC guidance
  const SUSPICIOUS_KEYWORDS = [
    'Remit', 'Offshore', 'FastFunds', 'RemitHub', 'Phantom',
    'Fake', 'Crypto', 'Gold Brokers', 'Investment'
  ]
  
  for (const tx of transactions) {
    const amount = parseFloat(tx.amount)
    let score = 0
    const rulesTriggered: any[] = []
    const flags: string[] = []
    const explanations: string[] = []
    
    const location = (tx.location || 'Australia').toString().trim()
    const merchant = (tx.merchant || tx.to_address || '').toString()
    const channel = (tx.channel || 'online').toString().toLowerCase()
    const txType = (tx.transaction_type || 'transfer').toString().toLowerCase()
    const counterparty = tx.to_address || ''
    
    // RULE 1: High-risk or foreign country
    if (HIGH_RISK_COUNTRIES.has(location)) {
      score += 1
      explanations.push(`Transaction involves high-risk country (${location})`)
      flags.push('HIGH_RISK_JURISDICTION')
      rulesTriggered.push({
        rule_id: 'HIGH_RISK_COUNTRY',
        name: 'High-Risk Jurisdiction',
        severity: 'high',
        weight: 1
      })
    } else if (location && location !== 'Australia' && !['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'].includes(location)) {
      score += 1
      explanations.push(`Foreign transaction (country: ${location})`)
      rulesTriggered.push({
        rule_id: 'FOREIGN_TRANSACTION',
        name: 'Foreign Transaction',
        severity: 'medium',
        weight: 1
      })
    }
    
    // RULE 2: Large transaction (≥15,000 AUD)
    if (amount >= 15000) {
      score += 1
      explanations.push(`Large transaction amount (AUD ${amount.toLocaleString()})`)
      rulesTriggered.push({
        rule_id: 'LARGE_TRANSACTION',
        name: 'Large Transaction',
        severity: 'high',
        weight: 1
      })
    }
    
    // RULE 3: Possible structuring (9,000-9,999 AUD)
    if (amount >= 9000 && amount < 10000) {
      score += 1
      explanations.push('Amount near AUD 10k threshold (possible structuring)')
      flags.push('STRUCTURING_SUSPECTED')
      rulesTriggered.push({
        rule_id: 'STRUCTURING',
        name: 'Structuring Pattern',
        severity: 'critical',
        weight: 1
      })
    }
    
    // RULE 4: Suspicious merchant keywords
    const lowerMerchant = merchant.toLowerCase()
    let suspiciousKeywordFound = false
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      if (lowerMerchant.includes(keyword.toLowerCase())) {
        score += 1
        explanations.push(`Suspicious merchant name contains '${keyword}'`)
        flags.push('SUSPICIOUS_MERCHANT')
        rulesTriggered.push({
          rule_id: 'SUSPICIOUS_MERCHANT',
          name: 'Suspicious Merchant Keyword',
          severity: 'high',
          weight: 1
        })
        suspiciousKeywordFound = true
        break
      }
    }
    
    // RULE 5: High-risk channel (wire or ATM)
    if (channel === 'wire' || channel === 'atm' || channel.includes('atm withdrawal')) {
      score += 1
      explanations.push(`Transaction via high-risk channel (${channel})`)
      rulesTriggered.push({
        rule_id: 'HIGH_RISK_CHANNEL',
        name: 'High-Risk Channel',
        severity: 'medium',
        weight: 1
      })
    }
    
    // RULE 6: Transfer without counterparty
    if (txType.includes('transfer') && (!counterparty || counterparty === 'unknown' || counterparty.trim() === '')) {
      score += 1
      explanations.push('Transfer without specified counterparty')
      rulesTriggered.push({
        rule_id: 'MISSING_COUNTERPARTY',
        name: 'Missing Counterparty',
        severity: 'medium',
        weight: 1
      })
    }
    
    // Determine risk level based on AUSTRAC training guide
    let riskLevel: string
    let riskClass: string
    if (score >= 4) {
      riskLevel = 'HIGH'
      riskClass = 'High'
      flags.push('SMR_REQUIRED')
    } else if (score >= 2) {
      riskLevel = 'MEDIUM'
      riskClass = 'Medium'
    } else {
      riskLevel = 'LOW'
      riskClass = 'Low'
    }
    
    // Convert to 0-100 scale for compatibility with existing UI
    const finalScore = Math.min(score * 16.67, 100) // 6 points max → 100
    
    scorecards.push({
      transaction_id: tx.id,
      policy_score: score,
      ml_score: 0,
      final_score: Math.round(finalScore),
      risk_level: riskLevel,
      mandatory_flags: flags,
      due_by_ts: null,
      indicators: {
        amount,
        location,
        merchant,
        channel
      },
      rules_triggered: rulesTriggered,
      rationale: explanations.length > 0 ? explanations.join(' | ') : 'No risk indicators detected',
      austrac_compliance: {
        reporting_required: riskLevel === 'HIGH',
        timeframe: riskLevel === 'HIGH' ? '3_business_days' : null,
        risk_class: riskClass
      }
    })
  }
  
  return scorecards
}

async function updateNetworkGraph(transactions: any[], supabase: any) {
  const addressMap = new Map<string, { total_volume: number, transaction_count: number, last_seen: string }>()
  const edgeMap = new Map<string, { from: string, to: string, amount: number, count: number, first: string, last: string }>()
  
  for (const tx of transactions) {
    const fromStats = addressMap.get(tx.from_address) || { total_volume: 0, transaction_count: 0, last_seen: tx.timestamp }
    fromStats.total_volume += parseFloat(tx.amount)
    fromStats.transaction_count += 1
    fromStats.last_seen = tx.timestamp
    addressMap.set(tx.from_address, fromStats)
    
    const toStats = addressMap.get(tx.to_address) || { total_volume: 0, transaction_count: 0, last_seen: tx.timestamp }
    toStats.total_volume += parseFloat(tx.amount)
    toStats.transaction_count += 1
    toStats.last_seen = tx.timestamp
    addressMap.set(tx.to_address, toStats)
    
    const edgeKey = `${tx.from_address}->${tx.to_address}`
    const edgeStats = edgeMap.get(edgeKey) || { 
      from: tx.from_address, 
      to: tx.to_address, 
      amount: 0, 
      count: 0, 
      first: tx.timestamp, 
      last: tx.timestamp 
    }
    edgeStats.amount += parseFloat(tx.amount)
    edgeStats.count += 1
    edgeStats.last = tx.timestamp
    edgeMap.set(edgeKey, edgeStats)
  }
  
  const nodes = Array.from(addressMap.entries()).map(([address, stats]) => ({
    address,
    total_volume: stats.total_volume,
    transaction_count: stats.transaction_count,
    last_seen: stats.last_seen
  }))
  
  const edges = Array.from(edgeMap.values()).map(edge => ({
    from_address: edge.from,
    to_address: edge.to,
    total_amount: edge.amount,
    transaction_count: edge.count,
    first_transaction: edge.first,
    last_transaction: edge.last
  }))
  
  if (nodes.length > 0) {
    await supabase.from('network_nodes').upsert(nodes, { onConflict: 'address' })
  }
  
  if (edges.length > 0) {
    await supabase.from('network_edges').upsert(edges, { onConflict: 'from_address,to_address' })
  }
}
