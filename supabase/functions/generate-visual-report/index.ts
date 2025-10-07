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
    const { reportData, reportType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create a descriptive prompt for the visual report
    let prompt = '';
    
    if (reportType === 'risk-heatmap') {
      prompt = `Create a professional risk heatmap infographic showing blockchain transaction risk analysis. 
      Include: ${reportData.highRiskCount} high-risk transactions (red), ${reportData.mediumRiskCount} medium-risk (orange), 
      ${reportData.lowRiskCount} low-risk (green). Make it clean, modern, and data-driven with clear labels. 
      Style: dark theme with quantum green accents (#00ff94). Ultra high resolution.`;
    } else if (reportType === 'transaction-flow') {
      prompt = `Create a professional transaction flow diagram showing blockchain transaction patterns. 
      Visualize ${reportData.totalTransactions} transactions across ${reportData.uniqueAddresses} addresses. 
      Show network connections, flow direction with arrows, and highlight anomalies in red. 
      Style: cybersecurity theme, dark background, quantum green (#00ff94) highlights. Ultra high resolution.`;
    } else if (reportType === 'compliance-summary') {
      prompt = `Create a professional compliance dashboard infographic for blockchain analysis. 
      Show compliance score: ${reportData.complianceScore}%, detected patterns, and risk breakdown. 
      Include pie charts and bar graphs. Style: professional, clean, dark theme with quantum green (#00ff94) accents. 
      Ultra high resolution.`;
    }

    console.log('Generating visual report with prompt:', prompt);

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
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI Gateway error:', error);
      throw new Error(`Failed to generate visual: ${error}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Visual report generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        reportType 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating visual report:', error);
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
