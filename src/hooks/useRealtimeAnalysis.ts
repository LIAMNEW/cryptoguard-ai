import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
