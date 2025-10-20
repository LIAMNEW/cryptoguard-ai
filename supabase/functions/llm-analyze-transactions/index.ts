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

    // Use LLM to intelligently extract and parse ANY transaction data format
    const extractionPrompt = `You are QuantumGuard AI, an intelligent financial transaction analyzer capable of understanding ANY data format.

File: ${fileName}
Content:
${fileContent.substring(0, 15000)}

MISSION: Intelligently analyze this data and extract ALL financial transactions, regardless of format (CSV, JSON, XML, plain text, tables, etc.).

For EACH transaction you find, extract and standardize:
- transaction_id: Create unique ID if none exists (use row number, hash, or generate)
- amount: The monetary value (extract numbers, handle currencies, decimals)
- timestamp: When it occurred (convert ANY date format to ISO 8601: YYYY-MM-DDTHH:mm:ssZ)
- from_address: Who sent it (account, wallet, merchant, person name, ID - whatever identifies sender)
- to_address: Who received it (account, wallet, customer, person, country - whatever identifies recipient)
- transaction_type: Best guess from: "blockchain", "banking", "cash_deposit", "wire_transfer", "card_payment", "transfer"

INTELLIGENCE GUIDELINES:
- Handle CSV, JSON, XML, Excel-like tables, plain text, mixed formats
- Infer missing fields intelligently (e.g., if only "merchant" exists, use it as from_address)
- Convert all date formats (MM/DD/YYYY, DD-MM-YYYY, timestamps, etc.) to ISO 8601
- Handle currency symbols ($, €, £, etc.) - extract just the number
- If transaction_id missing, generate: "tx_[row_number]" or use any unique identifier in the data
- Recognize patterns: debits/credits, purchases/sales, sends/receives
- If unsure about type, use "transfer" as default
- Extract ALL rows that look like transactions

OUTPUT: Return ONLY a valid JSON array with NO explanations, markdown, or extra text:
[{"transaction_id":"...","amount":123.45,"timestamp":"2023-01-01T12:00:00Z","from_address":"...","to_address":"...","transaction_type":"..."}]`

    console.log('🤖 Calling QuantumGuard AI for intelligent data extraction...')
    
    const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are QuantumGuard AI, an intelligent financial data extraction system. You can understand and parse ANY data format. Return ONLY valid JSON arrays with no markdown formatting.' },
          { role: 'user', content: extractionPrompt }
        ]
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
