import { useState, useEffect, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkGraph } from "./NetworkGraph";
import { TransactionTimeline } from "./TransactionTimeline";
import { AIChat } from "./AIChat";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
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
  Target
} from "lucide-react";

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

  useEffect(() => {
    loadAnalysisData();
  }, []);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : analysisData.anomaliesFound}</p>
            <p className="text-sm text-muted-foreground">Anomalies Found</p>
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
        <TabsList className="grid w-full grid-cols-7 glass-card p-1">
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Network</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Anomalies</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4 animate-fade-in">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Transaction Network Visualization</h3>
            <NetworkGraph nodes={networkData.nodes} links={networkData.links} />
            <p className="text-sm text-muted-foreground mt-2">
              Showing connections between {analysisData.totalTransactions} transactions
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Overall Risk Assessment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <Badge variant="destructive">High Risk</Badge>
                </div>
                <div className="w-full bg-glass-border rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-quantum-green via-yellow-500 to-red-500 h-3 rounded-full"
                    style={{ width: `${analysisData.averageRiskScore}%` }}
                  />
                </div>
                <p className="text-2xl font-bold text-foreground">{analysisData.averageRiskScore}/100</p>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Risk Factors</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Unusual Transaction Amounts</span>
                  <Badge variant="outline">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Frequency Patterns</span>
                  <Badge variant="destructive">High</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Geographic Distribution</span>
                  <Badge variant="secondary">Low</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time-based Clustering</span>
                  <Badge variant="destructive">High</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4 animate-fade-in">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Detected Anomalies</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-quantum-green border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading anomalies...</p>
                </div>
              ) : anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-quantum-green mx-auto mb-4" />
                  <p className="text-foreground font-medium">No anomalies detected</p>
                  <p className="text-muted-foreground text-sm">All transactions appear normal</p>
                </div>
              ) : (
                anomalies.map((anomaly: any) => {
                  const getAnomalyIcon = (type: string) => {
                    switch (type) {
                      case 'high_value': return '💰';
                      case 'unusual_amount': return '📊';
                      case 'rapid_transactions': return '⚡';
                      case 'circular': return '🔄';
                      case 'chain_transactions': return '🔗';
                      case 'high_velocity': return '🚀';
                      case 'round_amount': return '🎯';
                      case 'unusual_time': return '🕐';
                      default: return '⚠️';
                    }
                  };

                  const getSeverityVariant = (severity: string) => {
                    switch (severity.toLowerCase()) {
                      case 'critical': return 'destructive';
                      case 'high': return 'destructive';
                      case 'medium': return 'secondary';
                      default: return 'outline';
                    }
                  };

                  const formatAmount = (amount: number) => {
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(amount);
                  };

                  return (
                    <div key={anomaly.id} className="p-4 rounded-lg bg-glass-background border border-glass-border hover:border-quantum-green/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getAnomalyIcon(anomaly.type)}</span>
                            <span className="font-medium capitalize">{anomaly.type.replace(/_/g, ' ')}</span>
                            <Badge variant={getSeverityVariant(anomaly.severity)}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                          {anomaly.transaction && (
                            <div className="mt-3 p-3 rounded bg-glass-card border border-glass-border/50">
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Transaction ID:</span>
                                  <span className="font-mono text-foreground">{anomaly.transaction.transaction_id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Amount:</span>
                                  <span className="font-semibold text-foreground">{formatAmount(anomaly.transaction.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">From:</span>
                                  <span className="font-mono text-xs text-foreground">{anomaly.transaction.from_address.slice(0, 10)}...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">To:</span>
                                  <span className="font-mono text-xs text-foreground">{anomaly.transaction.to_address.slice(0, 10)}...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time:</span>
                                  <span className="text-xs text-foreground">{new Date(anomaly.transaction.timestamp).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-foreground">{anomaly.riskScore}</p>
                          <p className="text-xs text-muted-foreground">Risk Score</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(anomaly.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
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

        <TabsContent value="analytics" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Advanced Analytics</h3>
              <div className="h-64 bg-glass-background rounded-lg border border-glass-border flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BarChart3 className="w-16 h-16 text-quantum-green mx-auto animate-pulse" />
                  <p className="text-muted-foreground">Advanced analytics charts will render here</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Clustering Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cluster 1: Regular Activity</span>
                  <span className="text-sm text-quantum-green">85% (1,315 tx)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cluster 2: Suspicious Patterns</span>
                  <span className="text-sm text-yellow-400">10% (155 tx)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cluster 3: High Risk</span>
                  <span className="text-sm text-red-400">5% (77 tx)</span>
                </div>
              </div>
            </Card>
          </div>
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