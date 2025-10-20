import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Shield, DollarSign } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ZAxis
} from "recharts";

interface RiskScoreData {
  transactionId: string;
  amount: number;
  riskScore: number;
  riskLevel: string;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  explanation?: string;
}

export function RiskScoreDashboard() {
  const [data, setData] = useState<RiskScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    avgScore: 0
  });

  useEffect(() => {
    fetchRiskScores();
  }, []);

  const fetchRiskScores = async () => {
    try {
      setLoading(true);

      // Fetch transactions with their scorecards
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_id,
          amount,
          timestamp,
          from_address,
          to_address
        `)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (txError) throw txError;

      // Fetch corresponding scorecards with detailed rationale
      const { data: scorecards, error: scoreError } = await supabase
        .from('transaction_scorecards')
        .select('transaction_id, final_score, risk_level, rationale, rules_triggered')
        .in('transaction_id', transactions?.map(t => t.id) || []);

      if (scoreError) throw scoreError;

      // Merge data with explanations
      const riskData: RiskScoreData[] = transactions?.map(tx => {
        const scorecard = scorecards?.find(s => s.transaction_id === tx.id);
        
        // Extract explanation from rationale or rules_triggered
        let explanation = scorecard?.rationale || '';
        if (!explanation && scorecard?.rules_triggered) {
          const rules = Array.isArray(scorecard.rules_triggered) 
            ? scorecard.rules_triggered 
            : [];
          explanation = rules.map((r: any) => r.name).join(', ');
        }
        
        return {
          transactionId: tx.transaction_id,
          amount: parseFloat(tx.amount.toString()),
          riskScore: scorecard?.final_score || 0,
          riskLevel: scorecard?.risk_level || 'NORMAL',
          timestamp: tx.timestamp,
          fromAddress: tx.from_address,
          toAddress: tx.to_address,
          explanation
        };
      }) || [];

      setData(riskData);

      // Calculate stats
      const total = riskData.length;
      const highRisk = riskData.filter(d => d.riskLevel === 'SMR').length;
      const mediumRisk = riskData.filter(d => d.riskLevel === 'EDD').length;
      const lowRisk = riskData.filter(d => d.riskLevel === 'NORMAL').length;
      const avgScore = riskData.reduce((sum, d) => sum + d.riskScore, 0) / total || 0;

      setStats({
        total,
        highRisk,
        mediumRisk,
        lowRisk,
        avgScore: Math.round(avgScore)
      });

    } catch (error) {
      console.error('Error fetching risk scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SMR':
        return '#ef4444'; // red
      case 'EDD':
        return '#f59e0b'; // orange
      case 'NORMAL':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-4 space-y-2 border border-glass-border max-w-md">
          <p className="font-semibold text-sm text-foreground">Transaction: {data.transactionId}</p>
          <p className="text-xs text-muted-foreground">Amount: ${data.amount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Risk Score: {data.riskScore}/100</p>
          <Badge className={
            data.riskLevel === 'SMR' ? 'bg-red-500' :
            data.riskLevel === 'EDD' ? 'bg-orange-500' :
            'bg-green-500'
          }>
            {data.riskLevel}
          </Badge>
          <p className="text-xs text-muted-foreground">From: {data.fromAddress.substring(0, 20)}...</p>
          <p className="text-xs text-muted-foreground">To: {data.toAddress.substring(0, 20)}...</p>
          {data.explanation && (
            <p className="text-xs text-muted-foreground mt-2 border-t border-glass-border pt-2">
              {data.explanation}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Risk Data Available</h3>
        <p className="text-muted-foreground">
          Upload transaction data to generate AUSTRAC-compliant risk scores
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk (SMR)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.highRisk / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk (EDD)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.mediumRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.mediumRisk / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              AUSTRAC compliant scoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Score Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>AUSTRAC Risk Score Analysis</CardTitle>
          <CardDescription>
            Transaction amounts vs risk scores based on AUSTRAC regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="amount"
                name="Amount"
                unit="$"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Transaction Amount ($)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="riskScore"
                name="Risk Score"
                domain={[0, 100]}
                label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[50, 400]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  switch(value) {
                    case 'SMR': return 'High Risk (SMR)';
                    case 'EDD': return 'Medium Risk (EDD)';
                    case 'NORMAL': return 'Low Risk (Normal)';
                    default: return value;
                  }
                }}
              />
              <Scatter name="SMR" data={data.filter(d => d.riskLevel === 'SMR')}>
                {data.filter(d => d.riskLevel === 'SMR').map((entry, index) => (
                  <Cell key={`cell-smr-${index}`} fill={getRiskColor('SMR')} />
                ))}
              </Scatter>
              <Scatter name="EDD" data={data.filter(d => d.riskLevel === 'EDD')}>
                {data.filter(d => d.riskLevel === 'EDD').map((entry, index) => (
                  <Cell key={`cell-edd-${index}`} fill={getRiskColor('EDD')} />
                ))}
              </Scatter>
              <Scatter name="NORMAL" data={data.filter(d => d.riskLevel === 'NORMAL')}>
                {data.filter(d => d.riskLevel === 'NORMAL').map((entry, index) => (
                  <Cell key={`cell-normal-${index}`} fill={getRiskColor('NORMAL')} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AUSTRAC 8-Rule Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-quantum-green" />
            AUSTRAC 8-Rule Risk Scoring Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Detection Rules Applied:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Rule 1: Large Transactions (≥$10,000)</li>
                <li>✓ Rule 2: Structuring Detection ($9k-$10k)</li>
                <li>✓ Rule 3: Round Amount Patterns</li>
                <li>✓ Rule 4: High-Risk Jurisdictions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm invisible">.</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Rule 5: Cash Transaction Detection</li>
                <li>✓ Rule 6: Sanctions/PEP Screening</li>
                <li>✓ Rule 7: Velocity Anomaly Detection</li>
                <li>✓ Rule 8: KYC Inconsistency Checks</li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-glass-border">
            <div className="space-y-2">
              <Badge className="bg-red-500">High Risk (SMR)</Badge>
              <p className="text-sm text-muted-foreground">
                Score ≥70 or mandatory flags. Suspicious Matter Report required within 3 business days per AUSTRAC regulations.
              </p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-orange-500">Medium Risk (EDD)</Badge>
              <p className="text-sm text-muted-foreground">
                Score 40-69. Enhanced Due Diligence procedures must be applied. Continuous monitoring and documentation required.
              </p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-green-500">Low Risk (Normal)</Badge>
              <p className="text-sm text-muted-foreground">
                Score &lt;40. Standard Customer Due Diligence applies. Regular monitoring sufficient.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
