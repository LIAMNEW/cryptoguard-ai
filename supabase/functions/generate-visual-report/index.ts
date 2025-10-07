import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Create a descriptive prompt for the visual report
    let prompt = '';
    
    if (reportType === 'risk-heatmap') {
      prompt = `Create a professional risk heatmap infographic showing blockchain transaction risk analysis. 
      Include: ${reportData.highRiskCount} high-risk transactions (red), ${reportData.mediumRiskCount} medium-risk (orange), 
      ${reportData.lowRiskCount} low-risk (green). Make it clean, modern, and data-driven with clear labels. 
      Style: dark theme with quantum green accents (#00ff94). 16:9 aspect ratio.`;
    } else if (reportType === 'transaction-flow') {
      prompt = `Create a professional transaction flow diagram showing blockchain transaction patterns. 
      Visualize ${reportData.totalTransactions} transactions across ${reportData.uniqueAddresses} addresses. 
      Show network connections, flow direction with arrows, and highlight anomalies in red. 
      Style: cybersecurity theme, dark background, quantum green (#00ff94) highlights. 16:9 aspect ratio.`;
    } else if (reportType === 'compliance-summary') {
      prompt = `Create a professional compliance dashboard infographic for blockchain analysis. 
      Show compliance score: ${reportData.complianceScore}%, detected patterns, and risk breakdown. 
      Include pie charts and bar graphs. Style: professional, clean, dark theme with quantum green (#00ff94) accents. 
      16:9 aspect ratio.`;
    }

    console.log('Generating visual report with OpenAI, prompt:', prompt);

    const requestBody = {
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    };
    
    console.log('OpenAI request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error response:', error);
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, checking for image URL');
    
    // gpt-image-1 returns url, not b64_json
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      console.error('No image URL in response, full data:', JSON.stringify(data));
      throw new Error('No image generated - response missing url');
    }

    console.log('Visual report generated successfully, image URL:', imageUrl);

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
