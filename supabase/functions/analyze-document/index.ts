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
    const { imageData, documentType } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Analyzing document type:', documentType);

    // Use GPT-5 for document analysis with vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        max_completion_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain transaction and financial document analysis expert. Extract all relevant transaction details, identify potential risks, and provide compliance insights.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${documentType} document. Extract: transaction amounts, addresses/parties involved, dates, transaction types, and identify any suspicious patterns or compliance concerns. Provide a detailed analysis in JSON format with keys: amounts, parties, dates, transactionType, riskScore (0-100), riskFactors (array), complianceNotes.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to analyze document: ${error}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis generated');
    }

    console.log('Document analysis complete');

    // Try to parse JSON from the response
    let parsedAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      parsedAnalysis = JSON.parse(jsonText);
    } catch (e) {
      // If parsing fails, return raw text
      parsedAnalysis = {
        rawAnalysis: analysisText,
        amounts: [],
        parties: [],
        dates: [],
        transactionType: 'Unknown',
        riskScore: 50,
        riskFactors: ['Unable to parse structured data'],
        complianceNotes: analysisText
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: parsedAnalysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error analyzing document:', error);
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
