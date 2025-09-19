import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkGraph } from "./NetworkGraph";
import { TransactionTimeline } from "./TransactionTimeline";
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

  // Mock data for demonstration
  const analysisData = {
    riskScore: 73,
    anomaliesFound: 12,
    transactionsAnalyzed: 1547,
    highRiskTransactions: 8
  };

  return (
    <div className="space-y-6">
      {/* Analysis Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-quantum-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{analysisData.riskScore}</p>
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
              <p className="text-2xl font-bold text-foreground">{analysisData.anomaliesFound}</p>
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
              <p className="text-2xl font-bold text-foreground">{analysisData.transactionsAnalyzed}</p>
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
              <p className="text-2xl font-bold text-foreground">{analysisData.highRiskTransactions}</p>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </div>
          </div>
        </Card>
      </div>

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
            <NetworkGraph />
            <p className="text-sm text-muted-foreground mt-2">
              Showing connections between {analysisData.transactionsAnalyzed} transactions
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
                    style={{ width: `${analysisData.riskScore}%` }}
                  />
                </div>
                <p className="text-2xl font-bold text-foreground">{analysisData.riskScore}/100</p>
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
              {[
                {
                  id: 1,
                  type: "Unusual Amount",
                  description: "Transaction amount 500% above average",
                  severity: "High",
                  confidence: 94
                },
                {
                  id: 2,
                  type: "Frequency Spike",
                  description: "15 transactions in 2 minutes",
                  severity: "Critical",
                  confidence: 98
                },
                {
                  id: 3,
                  type: "Geographic Anomaly",
                  description: "Transactions from unusual location",
                  severity: "Medium",
                  confidence: 76
                }
              ].map((anomaly) => (
                <div key={anomaly.id} className="p-4 rounded-lg bg-glass-background border border-glass-border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="font-medium">{anomaly.type}</span>
                        <Badge variant={anomaly.severity === "Critical" ? "destructive" : 
                                      anomaly.severity === "High" ? "destructive" : "secondary"}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{anomaly.confidence}%</p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 animate-fade-in">
          <TransactionTimeline />
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
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Export & Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="bg-quantum-green hover:bg-quantum-green/90 text-background">
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
              <Button variant="outline" className="border-quantum-green text-quantum-green hover:bg-quantum-green/10">
                <Download className="w-4 h-4 mr-2" />
                Export CSV Data
              </Button>
              <Button variant="outline" className="border-quantum-green text-quantum-green hover:bg-quantum-green/10">
                <Download className="w-4 h-4 mr-2" />
                Export JSON Data
              </Button>
              <Button variant="outline" className="border-quantum-green text-quantum-green hover:bg-quantum-green/10">
                <Download className="w-4 h-4 mr-2" />
                Save Analysis Session
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}