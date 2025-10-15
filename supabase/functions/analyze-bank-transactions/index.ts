import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BankTransaction {
  transaction_id: string;
  timestamp: string;
  amount: number;
  merchant_name: string;
  country_of_origin: string;
}

interface FlaggedTransaction extends BankTransaction {
  suspicion_reason: string;
  risk_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    console.log(`Processing ${transactions.length} bank transactions for fraud detection`);

    const flaggedTransactions: FlaggedTransaction[] = [];
    const reasonCounts: Record<string, number> = {
      'Late-night transaction': 0,
      'Suspicious merchant name': 0,
      'Foreign country of origin': 0,
      'Potential card testing': 0,
    };

    for (const tx of transactions) {
      const suspicionReasons: string[] = [];
      let riskScore = 0;

      // Check 1: Unusual Timing (12:00 AM - 4:00 AM)
      const txDate = new Date(tx.timestamp);
      const hour = txDate.getHours();
      if (hour >= 0 && hour < 4) {
        suspicionReasons.push('Late-night transaction');
        reasonCounts['Late-night transaction']++;
        riskScore += 25;
      }

      // Check 2: Suspicious Merchant Name
      const suspiciousPatterns = [
        /uber.*incorporated/i,
        /\d{5,}/,  // Long number sequences
        /^[A-Z]{10,}$/,  // All caps, very long
        /xxx|test|dummy/i,
        /\$\$\$/,
      ];
      const merchantName = tx.merchant_name || '';
      if (suspiciousPatterns.some(pattern => pattern.test(merchantName))) {
        suspicionReasons.push('Suspicious merchant name');
        reasonCounts['Suspicious merchant name']++;
        riskScore += 35;
      }

      // Check 3: Foreign Transaction
      if (tx.country_of_origin && tx.country_of_origin.toLowerCase() !== 'australia') {
        suspicionReasons.push('Foreign country of origin');
        reasonCounts['Foreign country of origin']++;
        riskScore += 20;
      }

      // Check 4: Repetitive Small Amounts (Card Testing)
      if (tx.amount < 2.00) {
        suspicionReasons.push('Potential card testing');
        reasonCounts['Potential card testing']++;
        riskScore += 30;
      }

      // If flagged, add to results
      if (suspicionReasons.length > 0) {
        flaggedTransactions.push({
          ...tx,
          suspicion_reason: suspicionReasons.join(', '),
          risk_score: Math.min(riskScore, 100),
        });
      }
    }

    // Store results in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store flagged transactions as analysis results
    if (flaggedTransactions.length > 0) {
      const analysisRecords = flaggedTransactions.map(tx => ({
        transaction_id: crypto.randomUUID(),
        risk_score: tx.risk_score,
        anomaly_detected: true,
        anomaly_type: tx.suspicion_reason,
        risk_level: tx.risk_score >= 70 ? 'high' : tx.risk_score >= 40 ? 'medium' : 'low',
        general_risk_score: tx.risk_score,
      }));

      const { error: insertError } = await supabase
        .from('analysis_results')
        .insert(analysisRecords);

      if (insertError) {
        console.error('Error storing analysis results:', insertError);
      }
    }

    const summary = {
      total_transactions: transactions.length,
      flagged_count: flaggedTransactions.length,
      reason_breakdown: reasonCounts,
      flagged_transactions: flaggedTransactions,
      average_risk_score: flaggedTransactions.length > 0 
        ? flaggedTransactions.reduce((sum, tx) => sum + tx.risk_score, 0) / flaggedTransactions.length 
        : 0,
    };

    console.log('Analysis summary:', {
      total: summary.total_transactions,
      flagged: summary.flagged_count,
      reasons: reasonCounts,
    });

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-bank-transactions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
