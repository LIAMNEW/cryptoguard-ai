import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Save, FileText, BarChart3, FileSearch } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { AIGraphGenerator } from "./AIGraphGenerator";
import { DocumentAnalyzer } from "./DocumentAnalyzer";

interface ReportGeneratorProps {
  analysisData: {
    totalTransactions: number;
    averageRiskScore: number;
    anomaliesFound: number;
    highRiskTransactions: number;
  };
  anomalies: any[];
  riskData: any;
  networkData: any;
  timelineData: any[];
}

export function ReportGenerator({
  analysisData,
  anomalies,
  riskData,
  networkData,
  timelineData,
}: ReportGeneratorProps) {
  const [saving, setSaving] = useState(false);
  const [analysisName, setAnalysisName] = useState("");
  const [analysisDescription, setAnalysisDescription] = useState("");

  const handleDownloadPDF = async () => {
    try {
      toast.info("Generating PDF report...");
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.text("QuantumGuard AI - Analysis Report", pageWidth / 2, 20, { align: "center" });
      
      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: "center" });
      
      // Overview Section
      doc.setFontSize(14);
      doc.text("Analysis Overview", 14, 40);
      doc.setFontSize(10);
      doc.text(`Total Transactions: ${analysisData.totalTransactions.toLocaleString()}`, 14, 50);
      doc.text(`Average Risk Score: ${analysisData.averageRiskScore}/100`, 14, 56);
      doc.text(`Anomalies Found: ${analysisData.anomaliesFound}`, 14, 62);
      doc.text(`High Risk Transactions: ${analysisData.highRiskTransactions}`, 14, 68);
      
      // Key Findings
      doc.setFontSize(14);
      doc.text("Key Findings", 14, 80);
      doc.setFontSize(10);
      
      let yPos = 90;
      anomalies.slice(0, 5).forEach((anomaly, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${anomaly.type}: ${anomaly.description}`, 14, yPos);
        yPos += 10;
      });
      
      doc.save("quantumguard-analysis-report.pdf");
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
        ["Transaction Analysis Report"],
        ["Generated", new Date().toISOString()],
        [""],
        ["Metric", "Value"],
        ["Total Transactions", analysisData.totalTransactions.toString()],
        ["Average Risk Score", analysisData.averageRiskScore.toString()],
        ["Anomalies Found", analysisData.anomaliesFound.toString()],
        ["High Risk Transactions", analysisData.highRiskTransactions.toString()],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quantumguard-analysis.csv";
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          reportVersion: "1.0",
        },
        analysis: analysisData,
        anomalies: anomalies,
        riskData: riskData,
        networkData: networkData,
        timelineData: timelineData,
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quantumguard-analysis.json";
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("JSON exported successfully!");
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error("Failed to export JSON");
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisName.trim()) {
      toast.error("Please enter an analysis name");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any).from("saved_analyses").insert({
        name: analysisName,
        description: analysisDescription,
        total_transactions: analysisData.totalTransactions,
        high_risk_count: analysisData.highRiskTransactions,
        anomalies_count: analysisData.anomaliesFound,
        average_risk_score: analysisData.averageRiskScore,
        snapshot_data: {
          analysis: analysisData,
          anomalies: anomalies,
          riskData: riskData,
          networkData: networkData,
          timelineData: timelineData,
        },
      });

      if (error) throw error;

      toast.success("Analysis saved successfully!");
      setAnalysisName("");
      setAnalysisDescription("");
    } catch (error) {
      console.error("Save analysis error:", error);
      toast.error("Failed to save analysis");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Advanced Reports & Intelligence</h3>
        
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-glass-background">
            <TabsTrigger value="export" className="data-[state=active]:bg-quantum-green data-[state=active]:text-background">
              <FileText className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="visual" className="data-[state=active]:bg-quantum-green data-[state=active]:text-background">
              <BarChart3 className="w-4 h-4 mr-2" />
              Visual Intelligence
            </TabsTrigger>
            <TabsTrigger value="document" className="data-[state=active]:bg-quantum-green data-[state=active]:text-background">
              <FileSearch className="w-4 h-4 mr-2" />
              Document Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadPDF}
                className="bg-quantum-green hover:bg-quantum-green/90 text-background"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="border-quantum-green text-quantum-green hover:bg-quantum-green/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV Data
              </Button>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="border-quantum-green text-quantum-green hover:bg-quantum-green/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON Data
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="visual">
            <AIGraphGenerator 
              transactionData={{
                totalTransactions: analysisData.totalTransactions,
                averageRiskScore: analysisData.averageRiskScore,
                anomaliesFound: analysisData.anomaliesFound,
                highRiskTransactions: analysisData.highRiskTransactions,
                lowRisk: analysisData.totalTransactions - analysisData.highRiskTransactions - Math.floor(analysisData.totalTransactions * 0.25),
                mediumRisk: Math.floor(analysisData.totalTransactions * 0.25),
                highRisk: analysisData.highRiskTransactions
              }}
            />
          </TabsContent>

          <TabsContent value="document">
            <DocumentAnalyzer />
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Save Analysis</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Save this analysis session for future reference and comparison
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Analysis Name *
            </label>
            <Input
              placeholder="e.g., Q4 2023 Transaction Review"
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <Textarea
              placeholder="Add notes about this analysis..."
              value={analysisDescription}
              onChange={(e) => setAnalysisDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            onClick={handleSaveAnalysis}
            disabled={saving}
            className="bg-quantum-green hover:bg-quantum-green/90 text-background w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Analysis"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
