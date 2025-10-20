import { useState, useEffect } from "react";
import { RiskPieChart } from "@/components/dashboard/RiskPieChart";
import { TransactionScatterPlot } from "@/components/dashboard/TransactionScatterPlot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { getRiskData } from "@/lib/supabase";

interface AnalyticsProps {
  onFileUpload: (data: { fileContent: string; fileName: string }) => Promise<any>;
  hasData: boolean;
}

interface RiskData {
  low: number;
  medium: number;
  high: number;
}

export function Analytics({ onFileUpload, hasData }: AnalyticsProps) {
  const [riskData, setRiskData] = useState<RiskData>({ low: 0, medium: 0, high: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasData) {
      const fetchRiskData = async () => {
        setLoading(true);
        try {
          const data = await getRiskData();
          setRiskData(data);
        } catch (error) {
          console.error('Error fetching risk data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchRiskData();
    }
  }, [hasData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analyze risk scores and investigate patterns through interactive visualizations.
        </p>
      </div>

      {/* Show message if no data */}
      {!hasData ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Data Available
            </h3>
            <p className="text-muted-foreground">
              Please upload transaction data first to view analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Visualizations - Only show when data exists */
        <>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Score Pie Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-quantum-green" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RiskPieChart riskData={riskData} />
              </CardContent>
            </Card>

            {/* Transaction Scatter Plot */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-quantum-green" />
                  Transaction Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionScatterPlot />
              </CardContent>
            </Card>
          </div>

          {/* Full Width Scatter Plot for Detailed Investigation */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Detailed Investigation View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <TransactionScatterPlot />
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}
    </div>
  );
}
