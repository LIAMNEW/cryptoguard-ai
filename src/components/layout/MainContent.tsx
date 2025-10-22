import { AUSTRACUpload } from "@/components/upload/AUSTRACUpload";
import { RiskScoreDashboard } from "@/components/dashboard/RiskScoreDashboard";
import { AIChat } from "@/components/dashboard/AIChat";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { UserSettings } from "@/components/settings/UserSettings";
import { Shield } from "lucide-react";

interface MainContentProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MainContent({ activeSection, onSectionChange }: MainContentProps) {
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
                Upload your transaction files (CSV, JSON, TXT, Excel) for AI-powered AUSTRAC-compliant analysis.
                Our system extracts, scores, and flags high-risk transactions automatically.
              </p>
            </div>
            <AUSTRACUpload onAnalysisComplete={() => onSectionChange('risk-score')} />
          </div>
        );

      case "risk-score":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                AUSTRAC Risk Score Dashboard
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real-time risk scoring based on AUSTRAC regulations. Monitor high-risk transactions and compliance status.
              </p>
            </div>
            <RiskScoreDashboard />
          </div>
        );

      case "ai-insights":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                AI Insights
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ask questions about your transactions, get risk analysis, and receive compliance guidance from our AI assistant.
              </p>
            </div>
            <AIChat />
          </div>
        );

      case "reports":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Export Reports
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Generate and export comprehensive reports for compliance, auditing, and analysis.
              </p>
            </div>
            <ReportGenerator />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Account Settings
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Manage your profile and notification preferences
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <UserSettings />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6 py-12">
            <Shield className="w-24 h-24 text-quantum-green mx-auto opacity-50" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to QuantumGuard AI</h2>
              <p className="text-muted-foreground">
                Upload transaction data to begin AUSTRAC-compliant risk analysis
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
      </div>
    </div>
  );
}