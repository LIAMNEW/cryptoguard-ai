import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ReportGenerator() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (txError) throw txError;

      const { data: scorecards, error: scError } = await supabase
        .from('transaction_scorecards')
        .select('*');

      if (scError) throw scError;

      const highRisk = scorecards?.filter(s => s.risk_level === 'HIGH').length || 0;
      const mediumRisk = scorecards?.filter(s => s.risk_level === 'MEDIUM').length || 0;
      const lowRisk = scorecards?.filter(s => s.risk_level === 'LOW').length || 0;
      const avgScore = scorecards?.reduce((sum, s) => sum + (s.final_score || 0), 0) / (scorecards?.length || 1);

      setAnalysisData({
        totalTransactions: transactions?.length || 0,
        highRiskCount: highRisk,
        mediumRiskCount: mediumRisk,
        lowRiskCount: lowRisk,
        averageRiskScore: avgScore,
        transactions,
        scorecards
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analysis data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!analysisData) return;

    const csv = [
      ['Transaction ID', 'Amount', 'Risk Score', 'Risk Level', 'Timestamp'].join(','),
      ...analysisData.transactions.map((tx: any) => {
        const scorecard = analysisData.scorecards.find((s: any) => s.transaction_id === tx.id);
        return [
          tx.transaction_id,
          tx.amount,
          scorecard?.final_score || 0,
          scorecard?.risk_level || 'UNKNOWN',
          tx.timestamp
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `austrac-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "CSV report downloaded successfully"
    });
  };

  const exportJSON = () => {
    if (!analysisData) return;

    const json = JSON.stringify({
      summary: {
        totalTransactions: analysisData.totalTransactions,
        highRisk: analysisData.highRiskCount,
        mediumRisk: analysisData.mediumRiskCount,
        lowRisk: analysisData.lowRiskCount,
        averageRiskScore: analysisData.averageRiskScore
      },
      transactions: analysisData.transactions.map((tx: any) => {
        const scorecard = analysisData.scorecards.find((s: any) => s.transaction_id === tx.id);
        return {
          transactionId: tx.transaction_id,
          amount: tx.amount,
          riskScore: scorecard?.final_score || 0,
          riskLevel: scorecard?.risk_level || 'UNKNOWN',
          rationale: scorecard?.rationale,
          timestamp: tx.timestamp
        };
      })
    }, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `austrac-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "JSON report downloaded successfully"
    });
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading analysis data...</CardContent></Card>;
  }

  if (!analysisData || analysisData.totalTransactions === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No transaction data available. Upload transactions to generate reports.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>Export your AUSTRAC compliance analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{analysisData.totalTransactions}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{analysisData.highRiskCount}</p>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{analysisData.mediumRiskCount}</p>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{analysisData.lowRiskCount}</p>
              <p className="text-sm text-muted-foreground">Low Risk</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download analysis in different formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={exportCSV} variant="outline" className="w-full justify-start gap-2">
            <FileText className="w-4 h-4" />
            Export as CSV
          </Button>
          <Button onClick={exportJSON} variant="outline" className="w-full justify-start gap-2">
            <FileDown className="w-4 h-4" />
            Export as JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
