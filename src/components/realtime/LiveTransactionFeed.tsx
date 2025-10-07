import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const LiveTransactionFeed = () => {
  const { realtimeTransactions } = useRealtimeTransactions();

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-quantum-green/20">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-quantum-green animate-pulse" />
        <h3 className="text-sm font-semibold text-foreground">Live Feed</h3>
        <Badge variant="outline" className="text-xs">
          {realtimeTransactions.length} new
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {realtimeTransactions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Waiting for new transactions...
          </p>
        ) : (
          realtimeTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-start gap-2 p-2 bg-background/50 rounded border border-border hover:border-quantum-green/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-foreground truncate">
                    {tx.from_address.slice(0, 8)}...
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-mono text-foreground truncate">
                    {tx.to_address.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-quantum-green">
                    {tx.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
