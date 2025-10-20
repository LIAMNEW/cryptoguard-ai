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
    
    console.log(`📄 Extracting transactions from: ${fileName} (${fileContent.length} characters)`)

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    // Use LLM to extract and parse transactions from file
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
- transaction_type (string): "blockchain", "banking", "cash_deposit", or "transfer"

IMPORTANT:
- If data has merchant/country fields, use those and set type to "banking"
- If data has from_address/to_address, use those and set type to "blockchain"
- Convert all dates to ISO 8601 format
- Include ALL transactions found
- Return ONLY valid JSON array, no explanations`

    console.log('🤖 Calling LLM for data extraction...')
    
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
      console.error('❌ LLM extraction error:', extractionResponse.status, errorText)
      throw new Error(`LLM extraction failed: ${extractionResponse.status}`)
    }

    const extractionData = await extractionResponse.json()
    const extractedText = extractionData.choices[0]?.message?.content || ''

    // Parse extracted transactions
    let extractedTransactions = []
    try {
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        extractedTransactions = JSON.parse(jsonMatch[0])
      } else {
        extractedTransactions = JSON.parse(extractedText)
      }
    } catch (e) {
      console.error('❌ Failed to parse LLM JSON response:', e)
      throw new Error('LLM did not return valid JSON')
    }

    console.log(`✅ Extracted ${extractedTransactions.length} transactions`)

    if (!Array.isArray(extractedTransactions) || extractedTransactions.length === 0) {
      throw new Error('No transactions found in file')
    }

    // Normalize transactions to database format
    const normalizedTransactions = extractedTransactions.map((tx: any) => ({
      transaction_id: tx.transaction_id || `tx_${Date.now()}_${Math.random()}`,
      from_address: tx.from_address || tx.merchant_name || 'unknown',
      to_address: tx.to_address || tx.country_of_origin || 'unknown',
      amount: parseFloat(tx.amount) || 0,
      timestamp: tx.timestamp,
      transaction_type: tx.transaction_type || tx.type || 'transfer',
    }))

    console.log(`🔄 Sending ${normalizedTransactions.length} transactions to unified analysis...`)

    // Call unified-analyze to handle storage and AUSTRAC scoring
    const { data: analysisResult, error: analysisError } = await supabaseClient.functions
      .invoke('unified-analyze', {
        body: { transactions: normalizedTransactions }
      })

    if (analysisError) {
      console.error('❌ Unified analysis error:', analysisError)
      throw analysisError
    }

    console.log(`✅ Analysis complete: ${analysisResult.analyzed_count} transactions analyzed`)

    return new Response(
      JSON.stringify({
        success: true,
        total_transactions: analysisResult.analyzed_count,
        high_risk_count: analysisResult.high_risk_count,
        scorecards: analysisResult.scorecards,
        patterns: {
          high_value_detected: analysisResult.scorecards?.some((s: any) => s.final_score >= 60),
          structuring_detected: analysisResult.scorecards?.some((s: any) => 
            s.rules_triggered?.some((r: any) => r.rule_id === 'STRUCT_CASH')
          ),
          velocity_abuse: analysisResult.scorecards?.some((s: any) => 
            s.rules_triggered?.some((r: any) => r.rule_id === 'VELOCITY_SPIKE')
          ),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error in llm-analyze-transactions:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
