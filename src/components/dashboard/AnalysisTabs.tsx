import { useState, useEffect, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TransactionScatterPlot } from "./TransactionScatterPlot";
import { TransactionTimeline } from "./TransactionTimeline";
import { NetworkGraph } from "./NetworkGraph";
import { AIChat } from "./AIChat";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { QuantumSafeIndicator } from "@/components/security/QuantumSafeIndicator";

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
  const [autoReanalyzing, setAutoReanalyzing] = useState(false);

  useEffect(() => {
    loadAnalysisData();
    checkAndReanalyze();
  }, []);

  const checkAndReanalyze = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check if there are analysis results with old unusual_time detection
      const { data: oldAnomalies, error } = await supabase
        .from('analysis_results')
        .select('id')
        .like('anomaly_type', '%unusual_time%')
        .limit(1);

      if (error) {
        console.error('Error checking for old anomalies:', error);
        return;
      }

      // If we found old unusual_time anomalies, trigger automatic re-analysis
      if (oldAnomalies && oldAnomalies.length > 0) {
        console.log('Found old unusual_time anomalies, triggering automatic re-analysis...');
        await performReanalysis();
      }
    } catch (error) {
      console.error('Error in checkAndReanalyze:', error);
    }
  };

  const performReanalysis = async () => {
    setAutoReanalyzing(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fetch all existing transactions
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      if (!transactions || transactions.length === 0) {
        console.log('No transactions found to re-analyze.');
        return;
      }

      console.log(`Re-analyzing ${transactions.length} transactions with improved detection...`);

      // Delete old analysis results
      const { error: deleteError } = await supabase
        .from('analysis_results')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;

      // Re-analyze transactions with new logic
      const { error: analyzeError } = await supabase.functions.invoke('analyze-transactions', {
        body: { transactions }
      });

      if (analyzeError) throw analyzeError;

      // Reload data
      await loadAnalysisData();
      console.log('✓ Auto re-analysis complete with improved detection');
    } catch (error) {
      console.error('Failed to auto re-analyze transactions:', error);
    } finally {
      setAutoReanalyzing(false);
    }
  };

  const loadAnalysisData = async () => {
    try {
      const [overview, anomaliesData, risk, network, timeline] = await Promise.all([
        getAnalysisOverview(),
        getAnomaliesData(),
        getRiskData(),
        getNetworkData(),
        getTimelineData()
      ]);
      
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
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : `${analysisData.averageRiskScore}/100`}</p>
            <p className="text-sm text-muted-foreground">Avg Risk Score</p>
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
        <TabsList className="grid w-full grid-cols-5 glass-card p-1">
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Network</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
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

        <TabsContent value="network" className="space-y-4 animate-fade-in">
          <NetworkGraph nodes={networkData.nodes} links={networkData.links} />
          
          {/* Quantum-Ready Infrastructure - Only in Network tab */}
          <QuantumSafeIndicator />
          
          {/* QuantumGuard AI Branding - Only in Network tab */}
          <Card className="glass-card p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-quantum-green flex items-center justify-center">
                <Shield className="w-5 h-5 text-background" />
              </div>
              <h2 className="text-quantum text-2xl font-bold">QuantumGuard AI</h2>
            </div>
            
            <p className="text-lg font-semibold text-foreground">
              Advanced Blockchain Transaction Analytics & AUSTRAC Compliance
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-quantum-green" />
                <span>Powered by Post-Quantum Cryptography</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-quantum-green" />
                <span>AI-Driven Risk Assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-quantum-green" />
                <span>Real-Time Compliance Monitoring</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="border-quantum-green text-quantum-green">
                Enterprise Grade Security
              </Badge>
              <Badge variant="outline" className="border-quantum-green text-quantum-green">
                Regulatory Compliant
              </Badge>
              <Badge variant="outline" className="border-quantum-green text-quantum-green">
                AI-Powered Analytics
              </Badge>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4">
              <Link to="/terms" className="hover:text-quantum-green transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-quantum-green transition-colors">
                Privacy Policy
              </Link>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Overall Risk Assessment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <Badge variant={analysisData.averageRiskScore > 75 ? "destructive" : analysisData.averageRiskScore > 50 ? "outline" : "secondary"}>
                    {analysisData.averageRiskScore > 75 ? "High Risk" : analysisData.averageRiskScore > 50 ? "Medium Risk" : "Low Risk"}
                  </Badge>
                </div>
                <div className="w-full bg-glass-border rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-quantum-green via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(analysisData.averageRiskScore, 100)}%` }}
                  />
                </div>
                <p className="text-2xl font-bold text-foreground">{analysisData.averageRiskScore}/100</p>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Risk Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Risk ({riskData.low})</span>
                  <div className="flex-1 mx-4 bg-glass-border rounded-full h-2">
                    <div className="bg-quantum-green h-2 rounded-full transition-all duration-500" style={{ width: `${(riskData.low / analysisData.totalTransactions) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium Risk ({riskData.medium})</span>
                  <div className="flex-1 mx-4 bg-glass-border rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(riskData.medium / analysisData.totalTransactions) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Risk ({riskData.high})</span>
                  <div className="flex-1 mx-4 bg-glass-border rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(riskData.high / analysisData.totalTransactions) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critical Risk ({riskData.critical})</span>
                  <div className="flex-1 mx-4 bg-glass-border rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(riskData.critical / analysisData.totalTransactions) * 100}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 animate-fade-in">
          <TransactionTimeline data={timelineData} />
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