import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  risk_level?: string;
  risk_score?: number;
}

interface InvestigativePanelProps {
  filterRiskLevel?: string;
}

export function InvestigativePanel({ filterRiskLevel }: InvestigativePanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [filterRiskLevel]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          transaction_id,
          from_address,
          to_address,
          amount,
          timestamp,
          analysis_results (risk_level, risk_score)
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      const enrichedTransactions = data?.map((tx: any) => ({
        id: tx.id,
        transaction_id: tx.transaction_id,
        from_address: tx.from_address,
        to_address: tx.to_address,
        amount: tx.amount,
        timestamp: tx.timestamp,
        risk_level: tx.analysis_results?.[0]?.risk_level || 'unknown',
        risk_score: tx.analysis_results?.[0]?.risk_score || 0
      })) || [];

      const filtered = filterRiskLevel
        ? enrichedTransactions.filter((tx: Transaction) => tx.risk_level === filterRiskLevel)
        : enrichedTransactions;

      setTransactions(filtered);
      if (filtered.length > 0) {
        setSelectedTx(filtered[0]);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'text-quantum-green',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400',
      unknown: 'text-muted-foreground'
    };
    return colors[level] || colors.unknown;
  };

  if (loading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-quantum-green" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-quantum-green" />
        Transaction Investigative Panel
        {filterRiskLevel && (
          <Badge variant="outline" className="ml-2">
            {filterRiskLevel} risk
          </Badge>
        )}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Transaction List */}
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTx?.id === tx.id
                    ? 'bg-quantum-green/10 border-quantum-green'
                    : 'bg-glass-background border-glass-border hover:border-quantum-green/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    {tx.transaction_id.substring(0, 12)}...
                  </span>
                  <Badge className={getRiskColor(tx.risk_level || 'unknown')}>
                    {tx.risk_level}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  ${tx.amount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Transaction Details */}
        <div className="space-y-4">
          {selectedTx ? (
            <>
              <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Transaction Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Amount</span>
                    <span className="text-lg font-bold text-foreground">
                      ${selectedTx.amount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Risk Score</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getRiskColor(selectedTx.risk_level || 'unknown')}`}>
                        {selectedTx.risk_score}/100
                      </span>
                      <Badge className={getRiskColor(selectedTx.risk_level || 'unknown')}>
                        {selectedTx.risk_level}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Time</span>
                    <span className="text-sm text-foreground">
                      {new Date(selectedTx.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Addresses</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">From</span>
                    <code className="text-xs text-foreground font-mono break-all">
                      {selectedTx.from_address}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">To</span>
                    <code className="text-xs text-foreground font-mono break-all">
                      {selectedTx.to_address}
                    </code>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a transaction to view details
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
