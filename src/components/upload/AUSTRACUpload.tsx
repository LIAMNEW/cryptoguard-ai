import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface AUSTRACUploadProps {
  onAnalysisComplete: () => void;
}

export function AUSTRACUpload({ onAnalysisComplete }: AUSTRACUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const parseCSV = (content: string) => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const tx: any = {};
      
      headers.forEach((header, idx) => {
        tx[header] = values[idx];
      });
      
      transactions.push(tx);
    }

    return transactions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const content = await file.text();
      setProgress(30);
      
      const transactions = parseCSV(content);
      
      if (transactions.length === 0) {
        throw new Error('No transactions found in file');
      }

      console.log(`📊 Parsed ${transactions.length} transactions`);
      setProgress(50);

      // Call new AUSTRAC analysis function
      const { data, error } = await supabase.functions.invoke('austrac-analyze', {
        body: { transactions }
      });

      if (error) throw error;

      setProgress(100);

      toast({
        title: "Analysis Complete! ✅",
        description: `Analyzed ${data.total_transactions} transactions. ${data.high_risk_count} high-risk detected.`
      });

      // Wait a moment then redirect
      setTimeout(() => {
        onAnalysisComplete();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload AUSTRAC Training Data
          </CardTitle>
          <CardDescription>
            Upload CSV files with transaction data for AUSTRAC compliance analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center hover:border-quantum-cyan transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-quantum-cyan/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-quantum-cyan" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  CSV files only • Max 50MB
                </p>
              </div>
            </label>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Analyzing with AUSTRAC 6-Factor Model...</span>
                <span className="text-quantum-cyan">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="bg-quantum-cyan/5 border border-quantum-cyan/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Required CSV Format
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Required columns:</strong> TransactionID, Date, Type, Amount, Merchant, Country, Channel</p>
              <p><strong>Optional:</strong> Time, Counterparty</p>
              <p className="mt-2">Example: <code className="bg-background px-1 rounded">TX001,2025-09-01,Transfer,15000,UAE Gold,UAE,Wire</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AUSTRAC 6-Factor Risk Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-quantum-cyan">1.</span>
              <span className="text-muted-foreground">High-risk or foreign jurisdictions</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-quantum-cyan">2.</span>
              <span className="text-muted-foreground">Large transactions (≥$15,000)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-quantum-cyan">3.</span>
              <span className="text-muted-foreground">Structuring patterns ($9k-$10k)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-quantum-cyan">4.</span>
              <span className="text-muted-foreground">Suspicious merchant names</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-quantum-cyan">5.</span>
              <span className="text-muted-foreground">High-risk channels (Wire/ATM)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-quantum-cyan">6.</span>
              <span className="text-muted-foreground">Missing counterparty info</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
