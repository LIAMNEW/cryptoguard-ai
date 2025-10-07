import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPrompt, transactionData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create context from transaction data
    const dataContext = `
Transaction Analysis Data:
- Total Transactions: ${transactionData.totalTransactions}
- Average Risk Score: ${transactionData.averageRiskScore}
- Anomalies Found: ${transactionData.anomaliesFound}
- High Risk Transactions: ${transactionData.highRiskTransactions}
- Low Risk: ${transactionData.lowRisk || 0}
- Medium Risk: ${transactionData.mediumRisk || 0}
- High Risk: ${transactionData.highRisk || 0}
`;

    const fullPrompt = `${dataContext}

User Request: ${userPrompt}

Create a professional data visualization graph/chart image for blockchain transaction analysis. 
Style: Dark theme with quantum green (#00ff94) accents, modern, clean, cybersecurity aesthetic.
Make it detailed, clear, and visually appealing with proper labels and data representation.`;

    console.log('Generating AI graph with prompt:', fullPrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    console.log('Lovable AI response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI API error:', error);
      throw new Error(`AI Gateway error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log('AI graph generated successfully');
    
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error('No image in response');
      throw new Error('No graph generated');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: imageBase64
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating AI graph:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
