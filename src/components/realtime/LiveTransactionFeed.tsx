import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const LiveTransactionFeed = () => {
  const { realtimeTransactions } = useRealtimeTransactions();

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-quantum-green/20">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-quantum-green animate-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Live Blockchain Transaction Feed</h3>
        <Badge variant="outline" className="ml-auto">
          {realtimeTransactions.length} new
        </Badge>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {realtimeTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Waiting for blockchain transactions...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fetch transactions using the Blockchain Data Sources panel
            </p>
          </div>
        ) : (
          realtimeTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-start gap-2 p-3 bg-background/50 rounded border border-border hover:border-quantum-green/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-foreground truncate">
                    {tx.from_address.slice(0, 12)}...
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-mono text-foreground truncate">
                    {tx.to_address.slice(0, 12)}...
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-quantum-green">
                    {tx.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                  </span>
                </div>
                {tx.transaction_id && (
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    TX: {tx.transaction_id.slice(0, 10)}...
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
