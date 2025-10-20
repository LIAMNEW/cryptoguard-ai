import { useState, useEffect, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionScatterPlot } from "./TransactionScatterPlot";
import { TransactionTimeline } from "./TransactionTimeline";
import { AIChat } from "./AIChat";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { QuantumSafeIndicator } from "@/components/security/QuantumSafeIndicator";
import { 
  Network, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Brain, 
  Download,
  Activity,
  Zap,
  Globe,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Loading analysis data...');
      
      // Simulated data - replace with actual API calls
      const mockData = {
        overview: {
          totalTransactions: 1520,
          averageRiskScore: 5,
          anomaliesFound: 625,
          highRiskTransactions: 0
        },
        risk: {
          low: 830,
          medium: 96,
          high: 74,
          critical: 0
        },
        anomalies: [
          { id: '1', type: 'Suspicious Pattern', severity: 'high', description: 'Unusual transaction frequency detected', riskScore: 75 },
          { id: '2', type: 'Money Laundering', severity: 'critical', description: 'Layered transactions across multiple addresses', riskScore: 85 },
          { id: '3', type: 'Velocity Abuse', severity: 'medium', description: 'Rapid succession of transfers', riskScore: 45 }
        ],
        network: {
          nodes: [
            { id: '1', address: '1A1zP1...', amount: 50000, riskLevel: 'low' },
            { id: '2', address: '1BvBMS...', amount: 15000, riskLevel: 'medium' },
            { id: '3', address: '1C4eDQ...', amount: 85000, riskLevel: 'high' }
          ],
          links: [
            { source: '1', target: '2', amount: 12000 },
            { source: '2', target: '3', amount: 8500 }
          ]
        },
        timeline: [
          { timestamp: '00:00', volume: 45, riskScore: 20, anomalies: 0 },
          { timestamp: '06:00', volume: 67, riskScore: 35, anomalies: 1 },
          { timestamp: '12:00', volume: 156, riskScore: 30, anomalies: 1 },
          { timestamp: '18:00', volume: 298, riskScore: 60, anomalies: 2 },
          { timestamp: '22:00', volume: 156, riskScore: 25, anomalies: 0 }
        ]
      };

      setAnalysisData(mockData.overview);
      setRiskData(mockData.risk);
      setAnomalies(mockData.anomalies);
      setNetworkData(mockData.network);
      setTimelineData(mockData.timeline);

      console.log('✅ Analysis data loaded successfully');
      toast.success('Analysis data loaded');
    } catch (error) {
      console.error('❌ Failed to load analysis data:', error);
      setError('Failed to load analysis data');
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const OverviewCards = memo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="glass-card p-4 hover:border-quantum-green/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-quantum-green" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : analysisData.averageRiskScore}
            </p>
            <p className="text-sm text-muted-foreground">Risk Score</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4 hover:border-quantum-green/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : analysisData.totalTransactions.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4 hover:border-quantum-green/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : analysisData.anomaliesFound}
            </p>
            <p className="text-sm text-muted-foreground">Anomalies</p>
          </div>
        </div>
      </Card>
    </div>
  ));

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <OverviewCards />
        <Card className="glass-card p-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Analysis Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={loadAnalysisData} className="mt-4" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <OverviewCards />

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          onClick={loadAnalysisData} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          {loading ? "Refreshing..." : "Refresh Analysis"}
        </Button>
      </div>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 glass-card p-1">
          <TabsTrigger value="network" disabled={loading} className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Network</span>
          </TabsTrigger>
          <TabsTrigger value="risk" disabled={loading} className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" disabled={loading} className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="insights" disabled={loading} className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="export" disabled={loading} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4 animate-fade-in">
          <TransactionScatterPlot />
          <QuantumSafeIndicator />
          <Card className="glass-card p-6 text-center space-y-4">
            <h2 className="text-2xl font-bold text-quantum">QuantumGuard AI</h2>
            <p className="text-lg font-semibold text-foreground">
              Advanced Blockchain Transaction Analytics & AUSTRAC Compliance
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
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
                <span>Real-Time Compliance</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">AUSTRAC Risk Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">High Risk (SMR)</span>
                  <Badge variant="destructive">{riskData.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Medium Risk (EDD)</span>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">{riskData.medium}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Low Risk</span>
                  <Badge variant="secondary">{riskData.low}</Badge>
                </div>
                <div className="mt-4 pt-4 border-t border-glass-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Risk Score</span>
                    <p className="text-2xl font-bold text-foreground">{analysisData.averageRiskScore}/100</p>
                  </div>
                  <div className="w-full bg-glass-border rounded-full h-3 mt-2">
                    <div 
                      className="bg-gradient-to-r from-quantum-green via-yellow-500 to-red-500 h-3 rounded-full transition-all"
                      style={{ width: `${analysisData.averageRiskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Transactions</span>
                  <Badge variant="outline">{analysisData.totalTransactions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Anomalies Detected</span>
                  <Badge variant="outline">{analysisData.anomaliesFound}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Risk Count</span>
                  <Badge variant="destructive">{riskData.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reporting Required</span>
                  <Badge variant={riskData.high > 0 ? "destructive" : "outline"}>
                    {riskData.high > 0 ? 'Yes' : 'No'}
                  </Badge>
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
              {anomalies.slice(0, 3).map((anomaly: any) => (
                <div key={anomaly.id} className={cn(
                  "p-4 rounded-lg border",
                  anomaly.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  anomaly.severity === 'high' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                )}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn(
                      "w-5 h-5 flex-shrink-0 mt-0.5",
                      anomaly.severity === 'critical' ? 'text-red-400' :
                      anomaly.severity === 'high' ? 'text-yellow-400' :
                      'text-blue-400'
                    )} />
                    <div>
                      <h4 className="font-medium text-foreground mb-2">{anomaly.type}</h4>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                      <Badge className="mt-2" variant="outline">Risk: {anomaly.riskScore}/100</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* AI Chat */}
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
