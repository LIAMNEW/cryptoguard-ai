import { useRealtimeAnalysis } from '@/hooks/useRealtimeAnalysis';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const RiskAlertMonitor = () => {
  const { realtimeAnalysis, highRiskCount } = useRealtimeAnalysis();

  const highRiskAnalyses = realtimeAnalysis.filter(a => a.risk_score > 70);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-quantum-green/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
        <h3 className="text-sm font-semibold text-foreground">Risk Alerts</h3>
        <Badge variant="destructive" className="text-xs">
          {highRiskCount} high-risk
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {highRiskAnalyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-quantum-green mb-2" />
            <p className="text-xs text-muted-foreground">
              No high-risk transactions detected
            </p>
          </div>
        ) : (
          highRiskAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="p-3 bg-destructive/10 rounded border border-destructive/30 hover:border-destructive/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-foreground truncate">
                  TX: {analysis.transaction_id.slice(0, 12)}...
                </span>
                <Badge variant="destructive" className="text-xs flex-shrink-0">
                  Risk: {analysis.risk_score}
                </Badge>
              </div>
              
              {analysis.anomaly_type && (
                <p className="text-xs text-muted-foreground mb-1">
                  Type: {analysis.anomaly_type}
                </p>
              )}
              
              {analysis.network_cluster && (
                <p className="text-xs text-muted-foreground">
                  Cluster: {analysis.network_cluster}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
