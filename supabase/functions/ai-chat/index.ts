import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const endpoint = 'ai-chat'
  const maxRequests = 50
  const windowMs = 60000
  const windowStart = new Date(Date.now() - windowMs)
  
  try {
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle()

    if (existing && existing.request_count >= maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    if (existing) {
      await supabase
        .from('rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .eq('window_start', existing.window_start)

      return { allowed: true, remaining: maxRequests - existing.request_count - 1 }
    }

    await supabase.from('rate_limits').insert({
      identifier,
      endpoint,
      request_count: 1,
      window_start: new Date(),
    })

    return { allowed: true, remaining: maxRequests - 1 }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: maxRequests }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Rate limiting check
    const authHeader = req.headers.get('authorization')
    const identifier = authHeader?.split(' ')[1] || req.headers.get('x-forwarded-for') || 'anonymous'
    
    const rateLimit = await checkRateLimit(supabaseAdmin, identifier)
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0'
          },
        }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('OpenAI API Key status:', openAIApiKey ? 'Present' : 'Missing');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    const { message, conversationHistory = [] } = await req.json();
    
    console.log('Received message:', message);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get recent analysis data to provide context
    const [overviewResponse, anomaliesResponse, riskResponse] = await Promise.all([
      fetch(`${supabaseUrl}/functions/v1/get-analysis-data?type=overview`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      }),
      fetch(`${supabaseUrl}/functions/v1/get-analysis-data?type=anomalies`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      }),
      fetch(`${supabaseUrl}/functions/v1/get-analysis-data?type=risk`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      })
    ]);

    const overview = await overviewResponse.json();
    const anomalies = await anomaliesResponse.json();
    const riskData = await riskResponse.json();

    // Build context about the current analysis
    const analysisContext = `
Current Analysis Overview:
- Total Transactions: ${overview.totalTransactions}
- Average Risk Score: ${overview.averageRiskScore}
- Anomalies Found: ${overview.anomaliesFound}
- High Risk Transactions: ${overview.highRiskTransactions}

Risk Distribution:
- Low Risk: ${riskData.low}
- Medium Risk: ${riskData.medium}
- High Risk: ${riskData.high}
- Critical Risk: ${riskData.critical}

Recent Anomalies: ${anomalies.length > 0 ? anomalies.slice(0, 3).map((a: any) => 
  `${a.type} (Risk: ${a.riskScore}, Amount: $${a.transaction?.amount || 'N/A'})`
).join(', ') : 'None detected'}
`;

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are QuantumGuard AI, an expert blockchain transaction analyst and compliance specialist. You help analyze cryptocurrency transactions for fraud detection, risk assessment, and regulatory compliance. 

Current Analysis Context:
${analysisContext}

Provide detailed, technical insights about blockchain forensics, AUSTRAC compliance, money laundering patterns, and suspicious transaction behaviors. Be precise and professional in your responses. Use the current analysis data to provide specific insights about the user's transaction data.

When discussing specific patterns or anomalies, reference the actual data from the current analysis. Provide actionable recommendations for compliance and risk mitigation.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Calling OpenAI API with GPT-5...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_completion_tokens: 800,
        stream: true,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get response from AI assistant. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});