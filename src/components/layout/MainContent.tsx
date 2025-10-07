import { FileUpload } from "@/components/upload/FileUpload";
import { AnalysisTabs } from "@/components/dashboard/AnalysisTabs";
import { SavedAnalysesDashboard } from "@/components/dashboard/SavedAnalysesDashboard";
import { AuditLogsViewer } from "@/components/dashboard/AuditLogsViewer";
import { BlockchainSourceManager } from "@/components/dashboard/BlockchainSourceManager";
import { QuantumSafeIndicator } from "@/components/security/QuantumSafeIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";

interface MainContentProps {
  activeSection: string;
  hasData: boolean;
  onFileUpload: (transactions: any[]) => Promise<void>;
}

export function MainContent({ activeSection, hasData, onFileUpload }: MainContentProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "upload":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Upload Transaction Data
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Upload your blockchain transaction data to begin comprehensive analysis. 
                Our AI-powered system will analyze patterns, detect anomalies, and assess compliance risks.
              </p>
            </div>
            <FileUpload onFileUpload={onFileUpload} />
          </div>
        );

      case "saved":
        return <SavedAnalysesDashboard />;

      case "audit":
        return <AuditLogsViewer />;

      case "blockchain":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Live Blockchain Address Analysis
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Connect directly to Ethereum and Bitcoin networks to analyze transactions in real-time. 
                All fetched transactions are automatically analyzed by QuantumGuard AI for risks and anomalies.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BlockchainSourceManager />
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cross-Chain Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Pull transactions directly from Ethereum and Bitcoin networks. 
                      All fetched transactions are automatically analyzed for risks and anomalies 
                      using the AI-powered detection system.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "dashboard":
      case "network":
      case "anomalies":
      case "reports":
        if (!hasData) {
          return (
            <div className="space-y-6">
              <div className="text-center space-y-6 py-12">
                <Shield className="w-24 h-24 text-quantum-green mx-auto opacity-50" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">No Data Available</h2>
                  <p className="text-muted-foreground">
                    Please upload transaction data first to view analysis results.
                  </p>
                </div>
              </div>
              
              {/* Upload section in middle */}
              <div className="max-w-4xl mx-auto">
                <FileUpload onFileUpload={onFileUpload} />
              </div>
              
              {/* Quantum-ready infrastructure at bottom */}
              <div className="max-w-4xl mx-auto">
                <QuantumSafeIndicator />
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <AnalysisTabs />
            
            {/* Quantum-ready infrastructure at bottom of dashboard */}
            <div className="max-w-4xl mx-auto">
              <QuantumSafeIndicator />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6 py-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to QuantumGuard AI</h2>
              <p className="text-muted-foreground">
                Advanced blockchain analytics platform for fraud detection and compliance.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {renderContent()}
        
        {/* Branding Footer - Only show when analysis is complete */}
        {hasData && (
          <Card className="glass-card p-6 text-center space-y-4 mt-12">
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
        )}
      </div>
    </div>
  );
}