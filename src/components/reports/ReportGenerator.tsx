import { useState, useEffect } from "react";
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

export function ReportGenerator() {
  const [saving, setSaving] = useState(false);
  const [analysisName, setAnalysisName] = useState("");
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [analysisData, setAnalysisData] = useState({
    totalTransactions: 0,
    averageRiskScore: 0,
    anomaliesFound: 0,
    highRiskTransactions: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch transactions count
      const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Fetch scorecards for risk data
      const { data: scorecards } = await supabase
        .from('transaction_scorecards')
        .select('final_score, risk_level');

      const avgScore = scorecards?.reduce((sum, s) => sum + s.final_score, 0) / (scorecards?.length || 1) || 0;
      const highRisk = scorecards?.filter(s => s.risk_level === 'SMR' || s.risk_level === 'EDD').length || 0;

      // Fetch anomalies
      const { count: anomalyCount } = await supabase
        .from('analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('anomaly_detected', true);

      setAnalysisData({
        totalTransactions: txCount || 0,
        averageRiskScore: Math.round(avgScore),
        anomaliesFound: anomalyCount || 0,
        highRiskTransactions: highRisk,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info("Generating PDF report...");
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const lineHeight = 6;
      let yPos = 20;
      
      // Title
      doc.setFontSize(20);
      doc.text("QuantumGuard AI - Analysis Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;
      
      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
      
      // Overview Section
      doc.setFontSize(14);
      doc.text("Analysis Overview", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Transactions: ${analysisData.totalTransactions?.toLocaleString() || 0}`, 14, yPos);
      yPos += lineHeight;
      doc.text(`Average Risk Score: ${analysisData.averageRiskScore?.toFixed(2) || 0}/100`, 14, yPos);
      yPos += lineHeight;
      doc.text(`Anomalies Found: ${analysisData.anomaliesFound || 0}`, 14, yPos);
      yPos += lineHeight;
      doc.text(`High Risk Transactions: ${analysisData.highRiskTransactions || 0}`, 14, yPos);
      yPos += 12;
      
      // Risk Distribution - simplified for now
      yPos += 12;
      
      // Key Findings - simplified
      yPos += 6;
      
      const fileName = `quantumguard-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportCSV = () => {
    try {
      toast.info("Generating CSV export...");
      
      // Header section
      const csvRows = [
        ["QuantumGuard AI - Transaction Analysis Report"],
        ["Generated", new Date().toISOString()],
        [""],
        ["Summary Metrics"],
        ["Metric", "Value"],
        ["Total Transactions", (analysisData.totalTransactions || 0).toString()],
        ["Average Risk Score", (analysisData.averageRiskScore || 0).toFixed(2)],
        ["Anomalies Found", (analysisData.anomaliesFound || 0).toString()],
        ["High Risk Transactions", (analysisData.highRiskTransactions || 0).toString()],
        [""],
        ["Report End"]
      ];
      
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quantumguard-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error(`Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportJSON = () => {
    try {
      toast.info("Generating JSON export...");
      
      // Helper to safely serialize objects and avoid circular references
      const safeSerialize = (obj: any): any => {
        const seen = new WeakSet();
        
        const replacer = (key: string, value: any): any => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
          }
          
          // Handle special types
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'bigint') {
            return value.toString();
          }
          if (value === undefined) {
            return null;
          }
          
          return value;
        };
        
        return JSON.parse(JSON.stringify(obj, replacer));
      };
      
      const jsonData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          reportVersion: "1.0",
          generatedBy: "QuantumGuard AI",
        },
        summary: {
          totalTransactions: analysisData.totalTransactions || 0,
          averageRiskScore: analysisData.averageRiskScore || 0,
          anomaliesFound: analysisData.anomaliesFound || 0,
          highRiskTransactions: analysisData.highRiskTransactions || 0,
        }
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quantumguard-analysis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("JSON exported successfully!");
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error(`Failed to export JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
