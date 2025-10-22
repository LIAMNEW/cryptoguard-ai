import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Helper function to send email alerts
async function sendEmailAlert(analysis: AnalysisResult) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      console.log('No user email found, skipping email alert');
      return;
    }

    // Check user notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications, high_risk_alerts')
      .eq('id', user.id)
      .single();

    if (!profile?.email_notifications || !profile?.high_risk_alerts) {
      console.log('Email notifications disabled for user, skipping alert');
      return;
    }

    // Fetch transaction details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', analysis.transaction_id)
      .single();

    await supabase.functions.invoke('send-risk-alert-email', {
      body: {
        email: user.email,
        transactionId: analysis.transaction_id,
        riskScore: analysis.risk_score,
        anomalyType: analysis.anomaly_type,
        amount: transaction?.amount,
        fromAddress: transaction?.from_address,
        toAddress: transaction?.to_address,
      },
    });

    console.log('📧 Email alert sent successfully');
  } catch (error) {
    console.error('Failed to send email alert:', error);
    throw error;
  }
}

interface AnalysisResult {
  id: string;
  transaction_id: string;
  risk_score: number;
  anomaly_detected: boolean;
  anomaly_type?: string;
  network_cluster?: string;
}

export const useRealtimeAnalysis = () => {
  const [realtimeAnalysis, setRealtimeAnalysis] = useState<AnalysisResult[]>([]);
  const [highRiskCount, setHighRiskCount] = useState(0);

  useEffect(() => {
    console.log('🔴 Setting up realtime subscription for analysis results');
    
    const channel = supabase
      .channel('analysis-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analysis_results'
        },
        (payload) => {
          console.log('🔍 New analysis result:', payload.new);
          const newAnalysis = payload.new as AnalysisResult;
          
          setRealtimeAnalysis(prev => [newAnalysis, ...prev].slice(0, 50));
          
          // Alert for high-risk transactions (score > 70)
          if (newAnalysis.risk_score > 70) {
            setHighRiskCount(prev => prev + 1);
            
            toast({
              title: "⚠️ High Risk Transaction Alert",
              description: `Risk Score: ${newAnalysis.risk_score} | ${newAnalysis.anomaly_type || 'Unknown anomaly'}`,
              variant: "destructive",
            });

            // Send email alert for high-risk transactions
            sendEmailAlert(newAnalysis).catch(error => {
              console.error('Failed to send email alert:', error);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Analysis subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up analysis subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return { realtimeAnalysis, highRiskCount };
};
