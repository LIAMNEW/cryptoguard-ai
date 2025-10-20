import { useState, useEffect, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TransactionScatterPlot } from "./TransactionScatterPlot";
import { TransactionTimeline } from "./TransactionTimeline";
import { AIChat } from "./AIChat";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { QuantumSafeIndicator } from "@/components/security/QuantumSafeIndicator";
import { RiskPieChart } from "./RiskPieChart";

import { getAnalysisOverview, getAnomaliesData, getRiskData, getNetworkData, getTimelineData } from "@/lib/supabase";
import { 
  Network, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Brain, 
  BarChart3, 
  Download,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Globe,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";

export function AnalysisTabs() {
  const [activeTab, setActiveTab] = useState("network");
  const [analysisData, setAnalysisData] = useState({
    totalTransactions: 0,
    averageRiskScore: 0,
    anomaliesFound: 0,
    highRiskTransactions: 0
  });
  const [anomalies, setAnomalies] = useState([]);
  const [riskData, setRiskData] = useState({ low: 0, medium: 0, high: 0, critical: 0 });
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAnomalies, setExpandedAnomalies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      console.log('📊 Loading analysis data from unified pipeline...');
      
      const [overview, anomaliesData, risk, network, timeline] = await Promise.all([
        getAnalysisOverview(),
        getAnomaliesData(),
        getRiskData(),
        getNetworkData(),
        getTimelineData()
      ]);
      
      console.log('✅ Analysis data loaded:', {
        transactions: overview.totalTransactions,
        avgRisk: overview.averageRiskScore,
        highRisk: overview.highRiskTransactions,
        anomalies: anomaliesData.length
      });
      
      setAnalysisData(overview);
      setAnomalies(anomaliesData);
      setRiskData(risk);
      setNetworkData(network);
      setTimelineData(timeline);
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize the overview cards to prevent unnecessary re-renders
  const OverviewCards = memo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-quantum-green" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : analysisData.averageRiskScore}</p>
            <p className="text-sm text-muted-foreground">Risk Score</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : analysisData.totalTransactions.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : analysisData.highRiskTransactions}</p>
            <p className="text-sm text-muted-foreground">High Risk</p>
          </div>
        </div>
      </Card>
    </div>
  ));

  return (
    <div className="space-y-6">
      {/* Analysis Overview Cards */}
      <OverviewCards />

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card p-1">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4 animate-fade-in">
          <TransactionScatterPlot />
          <QuantumSafeIndicator />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskPieChart riskData={riskData} />
            
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Risk Analysis Summary</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Risk Score</span>
                    <p className="text-2xl font-bold text-foreground">{analysisData.averageRiskScore}/100</p>
                  </div>
                  <div className="w-full bg-glass-border rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-quantum-green via-yellow-500 to-red-500 h-3 rounded-full transition-all"
                      style={{ width: `${analysisData.averageRiskScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Transactions</span>
                    <Badge variant="outline">{analysisData.totalTransactions}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">High Risk Transactions</span>
                    <Badge variant="destructive">{riskData.high}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Medium Risk Transactions</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">{riskData.medium}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Low Risk Transactions</span>
                    <Badge variant="secondary">{riskData.low}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                    <span className="text-sm text-muted-foreground">Anomalies Detected</span>
                    <Badge variant="outline">{analysisData.anomaliesFound}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 animate-fade-in">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI-Powered Insights</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-quantum-green/10 border border-quantum-green/20">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-quantum-green flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Pattern Recognition Alert</h4>
                    <p className="text-sm text-muted-foreground">
                      The AI has identified a sophisticated money laundering pattern involving 
                      layered transactions across multiple addresses. This pattern shows characteristics 
                      typical of criminal networks attempting to obscure transaction trails.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Compliance Recommendation</h4>
                    <p className="text-sm text-muted-foreground">
                      Based on AUSTRAC guidelines, we recommend immediate reporting of 8 transactions 
                      that exceed suspicious activity thresholds. Enhanced due diligence is advised 
                      for addresses involved in these transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* AI Assistant Chat */}
          <AIChat />
        </TabsContent>

        <TabsContent value="export" className="space-y-4 animate-fade-in">
          <ReportGenerator 
            analysisData={analysisData}
            anomalies={anomalies}
            riskData={riskData}
            networkData={networkData}
            timelineData={timelineData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}