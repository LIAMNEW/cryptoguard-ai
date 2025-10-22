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

    // Split large files into chunks of ~100,000 characters to avoid AI token limits
    // Larger chunks = fewer API calls = faster processing within edge function timeout
    const CHUNK_SIZE = 100000
    const chunks: string[] = []
    
    if (fileContent.length > CHUNK_SIZE) {
      // Split by lines to avoid breaking mid-transaction
      const lines = fileContent.split('\n')
      let currentChunk = ''
      
      for (const line of lines) {
        if (currentChunk.length + line.length > CHUNK_SIZE && currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = line + '\n'
        } else {
          currentChunk += line + '\n'
        }
      }
      if (currentChunk) chunks.push(currentChunk)
      
      console.log(`📦 Split file into ${chunks.length} chunks for processing`)
    } else {
      chunks.push(fileContent)
    }

    // Process all chunks and collect transactions
    let allExtractedTransactions: any[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}...`)
      
      const extractionPrompt = `You are QuantumGuard AI, an intelligent financial transaction analyzer capable of understanding ANY data format.

File: ${fileName} (Chunk ${i + 1}/${chunks.length})
Content:
${chunks[i]}

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

      // Retry logic with timeout
      let extractionResponse: Response | null = null
      let retries = 0
      const maxRetries = 2
      
      while (retries <= maxRetries && !extractionResponse) {
        try {
          console.log(`🌐 Calling AI API (attempt ${retries + 1}/${maxRetries + 1})...`)
          
          // Create AbortController for 45 second timeout per chunk
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 45000)
          
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ LLM extraction error:', response.status, errorText)
            
            if (response.status === 429 || response.status >= 500) {
              // Retry on rate limit or server errors
              retries++
              if (retries <= maxRetries) {
                console.log(`⏳ Waiting 2s before retry...`)
                await new Promise(resolve => setTimeout(resolve, 2000))
                continue
              }
            }
            
            throw new Error(`LLM extraction failed: ${response.status} - ${errorText}`)
          }
          
          extractionResponse = response
          console.log(`✅ AI API call successful`)
        } catch (error) {
          if (error.name === 'AbortError') {
            console.error(`⏱️ Request timeout on attempt ${retries + 1}`)
            retries++
            if (retries <= maxRetries) {
              console.log(`⏳ Retrying after timeout...`)
              continue
            }
            throw new Error('AI API request timed out after multiple attempts')
          }
          
          console.error(`❌ Fetch error on attempt ${retries + 1}:`, error)
          retries++
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          throw error
        }
      }
      
      if (!extractionResponse) {
        throw new Error('Failed to get response from AI after all retries')
      }

      const extractionData = await extractionResponse.json()
      const extractedText = extractionData.choices[0]?.message?.content || ''

      // Parse extracted transactions from this chunk
      let chunkTransactions = []
      try {
        const jsonMatch = extractedText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          chunkTransactions = JSON.parse(jsonMatch[0])
        } else {
          chunkTransactions = JSON.parse(extractedText)
        }
      } catch (e) {
        console.error(`❌ Failed to parse LLM JSON response for chunk ${i + 1}:`, e)
        console.error('Raw response:', extractedText.substring(0, 500))
        throw new Error(`LLM did not return valid JSON for chunk ${i + 1}`)
      }

      console.log(`✅ Extracted ${chunkTransactions.length} transactions from chunk ${i + 1}`)
      allExtractedTransactions = allExtractedTransactions.concat(chunkTransactions)
    }

    console.log(`✅ Total extracted: ${allExtractedTransactions.length} transactions from all chunks`)

    if (!Array.isArray(allExtractedTransactions) || allExtractedTransactions.length === 0) {
      throw new Error('No transactions found in file')
    }

    // Normalize transactions to database format
    const normalizedTransactions = allExtractedTransactions.map((tx: any) => ({
      transaction_id: tx.transaction_id || `tx_${Date.now()}_${Math.random()}`,
      from_address: tx.from_address || tx.merchant_name || 'unknown',
      to_address: tx.to_address || tx.country_of_origin || 'unknown',
      amount: parseFloat(tx.amount) || 0,
      timestamp: tx.timestamp,
      transaction_type: tx.transaction_type || tx.type || 'transfer',
    }))

    // Check for existing transactions to avoid duplicates
    const transactionIds = normalizedTransactions.map(t => t.transaction_id)
    const { data: existingTxs } = await supabaseClient
      .from('transactions')
      .select('transaction_id')
      .in('transaction_id', transactionIds)

    const existingIds = new Set(existingTxs?.map(t => t.transaction_id) || [])
    const newTransactions = normalizedTransactions.filter(t => !existingIds.has(t.transaction_id))
    
    console.log(`📊 Found ${normalizedTransactions.length} total, ${existingIds.size} duplicates, ${newTransactions.length} new transactions`)

    if (newTransactions.length === 0) {
      console.log('✅ All transactions already exist in database')
      return new Response(
        JSON.stringify({
          success: true,
          total_transactions: normalizedTransactions.length,
          new_transactions: 0,
          duplicates: existingIds.size,
          high_risk_count: 0,
          message: 'All transactions already analyzed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log(`🔄 Sending ${newTransactions.length} new transactions to unified analysis...`)

    // Call unified-analyze to handle storage and AUSTRAC scoring
    const { data: analysisResult, error: analysisError } = await supabaseClient.functions
      .invoke('unified-analyze', {
        body: { transactions: newTransactions }
      })

    if (analysisError) {
      console.error('❌ Unified analysis error:', analysisError)
      throw analysisError
    }

    console.log(`✅ Analysis complete: ${analysisResult.analyzed_count} transactions analyzed`)

    return new Response(
      JSON.stringify({
        success: true,
        total_transactions: normalizedTransactions.length,
        new_transactions: analysisResult.analyzed_count,
        duplicates: existingIds.size,
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
