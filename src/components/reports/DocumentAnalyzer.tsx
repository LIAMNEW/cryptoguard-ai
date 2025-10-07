import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DocumentAnalysis {
  amounts: string[];
  parties: string[];
  dates: string[];
  transactionType: string;
  riskScore: number;
  riskFactors: string[];
  complianceNotes: string;
  rawAnalysis?: string;
}

export function DocumentAnalyzer() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG, WEBP) or PDF",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        setUploadedImage(base64Data);

        // Call edge function to analyze document
        const { data, error } = await supabase.functions.invoke('analyze-document', {
          body: {
            imageData: base64Data,
            documentType: file.type.includes('pdf') ? 'PDF' : 'Receipt/Invoice'
          }
        });

        if (error) throw error;

        if (data?.success && data?.analysis) {
          setAnalysis(data.analysis);
          toast({
            title: "Document analyzed",
            description: "AI has extracted transaction details from your document",
          });
        } else {
          throw new Error('Failed to analyze document');
        }
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze document",
        variant: "destructive"
      });
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-quantum-green" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Document Analyzer</h3>
          <p className="text-sm text-muted-foreground">Upload receipts, invoices, or transaction documents</p>
        </div>
      </div>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="w-full bg-quantum-green hover:bg-quantum-green/90 text-background"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Document...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>

        {uploadedImage && !isAnalyzing && (
          <div className="border border-glass-border rounded-lg overflow-hidden">
            <img 
              src={uploadedImage} 
              alt="Uploaded document" 
              className="w-full h-auto max-h-64 object-contain bg-glass-background"
            />
          </div>
        )}

        {analysis && (
          <div className="space-y-4 p-4 bg-glass-background rounded-lg border border-glass-border">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Analysis Results</h4>
              <Badge className={getRiskColor(analysis.riskScore)}>
                {getRiskLabel(analysis.riskScore)} ({analysis.riskScore}/100)
              </Badge>
            </div>

            {analysis.amounts && analysis.amounts.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amounts Detected</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {analysis.amounts.map((amount, idx) => (
                    <Badge key={idx} variant="outline" className="border-glass-border">
                      {amount}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.parties && analysis.parties.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Parties Involved</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {analysis.parties.map((party, idx) => (
                    <Badge key={idx} variant="outline" className="border-glass-border">
                      {party}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.transactionType && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                <p className="mt-1 text-sm">{analysis.transactionType}</p>
              </div>
            )}

            {analysis.riskFactors && analysis.riskFactors.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  Risk Factors
                </label>
                <ul className="mt-1 space-y-1">
                  {analysis.riskFactors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground pl-4">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.complianceNotes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Compliance Notes</label>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{analysis.complianceNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-glass-background rounded-lg border border-glass-border">
        <p className="text-xs text-muted-foreground">
          🔍 AI uses GPT-5 vision to extract transaction details, identify risks, and provide compliance insights
        </p>
      </div>
    </Card>
  );
}
