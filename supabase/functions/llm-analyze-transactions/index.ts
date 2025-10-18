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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { fileContent, fileName } = await req.json()
    
    console.log(`Analyzing file: ${fileName} (${fileContent.length} characters)`)

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    // Step 1: Use LLM to parse and extract transactions
    const extractionPrompt = `You are a financial data analyst. Parse the following transaction data and extract ALL transactions.

File: ${fileName}
Content:
${fileContent.substring(0, 15000)}

TASK: Extract all transactions and return them as a JSON array. Each transaction MUST include:
- transaction_id (string): unique identifier
- amount (number): transaction amount
- timestamp (ISO 8601 string): when it occurred
- from_address OR merchant_name (string): sender/merchant
- to_address OR country_of_origin (string): recipient/country
- type (string): "blockchain" or "banking"

IMPORTANT:
- If data has merchant/country fields, set type="banking"
- If data has from_address/to_address, set type="blockchain"
- Convert all dates to ISO 8601 format
- Include ALL transactions found
- Return ONLY valid JSON array, no explanations`

    console.log('Calling LLM for data extraction...')
    
    const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a precise data extraction system. Return only valid JSON.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.1,
      }),
    })

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text()
      console.error('LLM extraction error:', extractionResponse.status, errorText)
      throw new Error(`LLM extraction failed: ${extractionResponse.status}`)
    }

    const extractionData = await extractionResponse.json()
    const extractedText = extractionData.choices[0]?.message?.content || ''
    
    console.log('LLM extraction response:', extractedText.substring(0, 500))

    // Parse extracted transactions
    let transactions = []
    try {
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0])
      } else {
        transactions = JSON.parse(extractedText)
      }
    } catch (e) {
      console.error('Failed to parse LLM JSON response:', e)
      throw new Error('LLM did not return valid JSON')
    }

    console.log(`Extracted ${transactions.length} transactions`)

    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('No transactions found in file')
    }

    // Store transactions in database
    const transactionsToStore = transactions.map((tx: any) => ({
      transaction_id: tx.transaction_id,
      from_address: tx.from_address || tx.merchant_name || 'Unknown',
      to_address: tx.to_address || tx.country_of_origin || 'Unknown',
      amount: parseFloat(tx.amount),
      timestamp: tx.timestamp,
      transaction_type: tx.type || 'unknown'
    }))

    console.log('Storing transactions in database...')
    const { data: storedTxs, error: storeError } = await supabaseClient
      .from('transactions')
      .upsert(transactionsToStore, { onConflict: 'transaction_id' })
      .select()

    if (storeError) {
      console.error('Error storing transactions:', storeError)
      throw storeError
    }

    console.log(`Stored ${storedTxs?.length || 0} transactions`)

    // Step 2: Use LLM to analyze transactions for risks
    const analysisPrompt = `You are an AUSTRAC compliance and fraud detection expert. Analyze these ${transactions.length} transactions for risks.

Transactions:
${JSON.stringify(transactions.slice(0, 100), null, 2)}

TASK: Identify high-risk transactions and patterns. For EACH transaction, assess:
1. AUSTRAC Compliance Risk (0-100): structuring, unusual amounts, high-risk jurisdictions
2. Fraud Indicators: velocity, circular patterns, suspicious timing
3. Risk Level: LOW, MEDIUM, HIGH, VERY_HIGH, CRITICAL

Return JSON:
{
  "summary": {
    "total_transactions": number,
    "high_risk_count": number,
    "critical_count": number,
    "total_volume": number
  },
  "flagged_transactions": [
    {
      "transaction_id": "string",
      "risk_score": number (0-100),
      "risk_level": "string",
      "anomalies": ["array of detected issues"],
      "reason": "brief explanation"
    }
  ],
  "patterns": {
    "structuring_detected": boolean,
    "velocity_abuse": boolean,
    "circular_transactions": boolean,
    "unusual_timing": boolean
  }
}`

    console.log('Calling LLM for risk analysis...')

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an AUSTRAC compliance expert. Return only valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.2,
      }),
    })

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text()
      console.error('LLM analysis error:', analysisResponse.status, errorText)
      throw new Error(`LLM analysis failed: ${analysisResponse.status}`)
    }

    const analysisData = await analysisResponse.json()
    const analysisText = analysisData.choices[0]?.message?.content || ''
    
    console.log('LLM analysis response:', analysisText.substring(0, 500))

    let analysisResults
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResults = JSON.parse(jsonMatch[0])
      } else {
        analysisResults = JSON.parse(analysisText)
      }
    } catch (e) {
      console.error('Failed to parse analysis JSON:', e)
      throw new Error('LLM did not return valid analysis JSON')
    }

    // Store analysis results
    if (analysisResults.flagged_transactions && Array.isArray(analysisResults.flagged_transactions)) {
      const analysisRecords = analysisResults.flagged_transactions.map((result: any) => {
        const matchingTx = storedTxs?.find(tx => tx.transaction_id === result.transaction_id)
        if (!matchingTx) return null
        
        return {
          transaction_id: matchingTx.id,
          risk_score: Math.min(100, Math.max(0, result.risk_score || 75)),
          anomaly_detected: true,
          anomaly_type: result.anomalies?.join(', ') || result.reason || 'High Risk',
          risk_level: result.risk_level || 'HIGH',
        }
      }).filter((r: any) => r !== null)

      if (analysisRecords.length > 0) {
        console.log(`Storing ${analysisRecords.length} analysis results...`)
        const { error: analysisError } = await supabaseClient
          .from('analysis_results')
          .upsert(analysisRecords, { onConflict: 'transaction_id' })

        if (analysisError) {
          console.error('Error storing analysis:', analysisError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_transactions: transactions.length,
        high_risk_count: analysisResults.summary?.high_risk_count || 0,
        critical_count: analysisResults.summary?.critical_count || 0,
        patterns: analysisResults.patterns || {},
        flagged_transactions: analysisResults.flagged_transactions || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Analysis error:', error)
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
