import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Image as ImageIcon, Download, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VisualReportGeneratorProps {
  transactionData?: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    totalTransactions: number;
    uniqueAddresses: number;
    complianceScore: number;
  };
}

export function VisualReportGenerator({ transactionData }: VisualReportGeneratorProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("risk-heatmap");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const reportTypes = [
    { value: "risk-heatmap", label: "Risk Heatmap", description: "Visual risk distribution" },
    { value: "transaction-flow", label: "Transaction Flow", description: "Network flow diagram" },
    { value: "compliance-summary", label: "Compliance Dashboard", description: "Compliance metrics" },
  ];

  const generateVisualReport = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const defaultData = {
        highRiskCount: 15,
        mediumRiskCount: 45,
        lowRiskCount: 140,
        totalTransactions: 200,
        uniqueAddresses: 87,
        complianceScore: 78
      };

      const reportData = transactionData || defaultData;

      const { data, error } = await supabase.functions.invoke('generate-visual-report', {
        body: {
          reportData,
          reportType
        }
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Visual report generated",
          description: "Your AI-generated infographic is ready",
        });
      } else {
        throw new Error('Failed to generate visual report');
      }

    } catch (error) {
      console.error('Error generating visual report:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate visual report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `quantum-report-${reportType}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your visual report is being downloaded",
    });
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-quantum-green" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Visual Report Generator</h3>
          <p className="text-sm text-muted-foreground">Generate AI-powered infographics from your data</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Report Type</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="bg-glass-background border-glass-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={generateVisualReport}
          disabled={isGenerating}
          className="w-full bg-quantum-green hover:bg-quantum-green/90 text-background"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating AI Visual...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate Visual Report
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="space-y-4">
            <div className="border border-glass-border rounded-lg overflow-hidden">
              <img 
                src={generatedImage} 
                alt="Generated visual report" 
                className="w-full h-auto"
              />
            </div>
            <Button
              onClick={downloadImage}
              variant="outline"
              className="w-full border-glass-border hover:bg-glass-background"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-glass-background rounded-lg border border-glass-border">
        <p className="text-xs text-muted-foreground">
          ✨ AI generates custom infographics based on your transaction data using advanced visual intelligence
        </p>
      </div>
    </Card>
  );
}
