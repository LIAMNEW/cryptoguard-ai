import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedAnalysis {
  id: string;
  name: string;
  description: string | null;
  analysis_date: string;
  total_transactions: number;
  high_risk_count: number;
  anomalies_count: number;
  average_risk_score: number;
  snapshot_data: any;
}

export function SavedAnalysesDashboard() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const loadSavedAnalyses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("saved_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error("Failed to load saved analyses:", error);
      toast.error("Failed to load saved analyses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("saved_analyses").delete().eq("id", id);

      if (error) throw error;

      setAnalyses(analyses.filter((a) => a.id !== id));
      toast.success("Analysis deleted successfully");
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      toast.error("Failed to delete analysis");
    }
  };

  const handleDownloadAnalysis = (analysis: SavedAnalysis) => {
    try {
      const jsonData = {
        ...analysis,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysis.name.replace(/\s+/g, "-").toLowerCase()}-${analysis.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Analysis exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analysis");
    }
  };

  const getRiskBadgeVariant = (score: number) => {
    if (score >= 75) return "destructive";
    if (score >= 50) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-quantum-green border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (selectedAnalysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{selectedAnalysis.name}</h2>
            <p className="text-muted-foreground">{selectedAnalysis.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-4">
            <div className="text-sm text-muted-foreground">Total Transactions</div>
            <div className="text-2xl font-bold text-foreground">
              {selectedAnalysis.total_transactions.toLocaleString()}
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="text-sm text-muted-foreground">Risk Score</div>
            <div className="text-2xl font-bold text-foreground">{selectedAnalysis.average_risk_score}</div>
          </Card>
          <Card className="glass-card p-4">
            <div className="text-sm text-muted-foreground">Anomalies</div>
            <div className="text-2xl font-bold text-foreground">{selectedAnalysis.anomalies_count}</div>
          </Card>
          <Card className="glass-card p-4">
            <div className="text-sm text-muted-foreground">High Risk</div>
            <div className="text-2xl font-bold text-foreground">{selectedAnalysis.high_risk_count}</div>
          </Card>
        </div>

        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Full Analysis Data</h3>
          <pre className="bg-glass-background p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(selectedAnalysis.snapshot_data, null, 2)}
          </pre>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Saved Analyses</h2>
        <p className="text-muted-foreground">View and manage your saved analysis sessions</p>
      </div>

      {analyses.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <p className="text-muted-foreground mb-2">No saved analyses yet</p>
          <p className="text-sm text-muted-foreground">
            Complete an analysis and save it from the Export tab
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="glass-card p-6 hover:border-quantum-green/50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{analysis.name}</h3>
                    {analysis.description && (
                      <p className="text-sm text-muted-foreground mt-1">{analysis.description}</p>
                    )}
                  </div>
                  <Badge variant={getRiskBadgeVariant(analysis.average_risk_score)}>
                    Risk: {analysis.average_risk_score}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Transactions</div>
                    <div className="font-semibold text-foreground">
                      {analysis.total_transactions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Anomalies</div>
                    <div className="font-semibold text-foreground">{analysis.anomalies_count}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">High Risk</div>
                    <div className="font-semibold text-foreground">{analysis.high_risk_count}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(analysis.analysis_date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAnalysis(analysis)}
                      className="border-quantum-green text-quantum-green hover:bg-quantum-green/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAnalysis(analysis)}
                      className="border-quantum-green text-quantum-green hover:bg-quantum-green/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{analysis.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(analysis.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
