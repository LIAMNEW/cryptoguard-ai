import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Download, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIGraphGeneratorProps {
  transactionData: {
    totalTransactions: number;
    averageRiskScore: number;
    anomaliesFound: number;
    highRiskTransactions: number;
    lowRisk?: number;
    mediumRisk?: number;
    highRisk?: number;
  };
}

export function AIGraphGenerator({ transactionData }: AIGraphGeneratorProps) {
  const { toast } = useToast();
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const examplePrompts = [
    "Show risk distribution as a pie chart",
    "Create a bar graph comparing risk levels",
    "Visualize transaction volume over time",
    "Show network connections as a node diagram"
  ];

  const generateGraph = async () => {
    if (!userPrompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe what kind of graph you'd like to see",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-graph', {
        body: {
          userPrompt,
          transactionData
        }
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Graph generated!",
          description: "Your AI-powered visualization is ready",
        });
      } else {
        throw new Error('Failed to generate graph');
      }

    } catch (error) {
      console.error('Error generating graph:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate graph",
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
    link.download = `ai-graph-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your graph is being downloaded",
    });
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-quantum-green" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Analytics Graph Generator</h3>
          <p className="text-sm text-muted-foreground">Describe the graph you want to see</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">What would you like to visualize?</label>
          <div className="flex gap-2">
            <Input
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Show me a bar chart of risk levels..."
              className="bg-glass-background border-glass-border"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  generateGraph();
                }
              }}
            />
            <Button
              onClick={generateGraph}
              disabled={isGenerating}
              className="bg-quantum-green hover:bg-quantum-green/90 text-background shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <p className="text-xs text-muted-foreground w-full mb-1">Try these:</p>
          {examplePrompts.map((example, i) => (
            <button
              key={i}
              onClick={() => setUserPrompt(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-glass-background border border-glass-border hover:border-quantum-green/50 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        {generatedImage && (
          <div className="space-y-4 animate-fade-in">
            <div className="border border-glass-border rounded-lg overflow-hidden">
              <img 
                src={generatedImage} 
                alt="AI generated graph" 
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadImage}
                variant="outline"
                className="flex-1 border-glass-border hover:bg-glass-background"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => setGeneratedImage(null)}
                variant="outline"
                className="border-glass-border hover:bg-glass-background"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-glass-background rounded-lg border border-glass-border">
        <p className="text-xs text-muted-foreground">
          ✨ Powered by Nano banana AI - Type any graph description and watch it come to life
        </p>
      </div>
    </Card>
  );
}
