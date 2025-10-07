import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";

export function BlockchainSourceManager() {
  const [source, setSource] = useState("ethereum");
  const [address, setAddress] = useState("");
  const [limit, setLimit] = useState("10");
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-blockchain-data', {
        body: {
          source,
          address: address || undefined,
          limit: parseInt(limit)
        }
      });

      if (error) throw error;

      toast.success(`Fetched ${data.count} transactions from ${source}. QuantumGuard AI is analyzing...`);
      
      // Trigger AI analysis on the fetched transactions
      if (data.transactions && data.transactions.length > 0) {
        const { error: analysisError } = await supabase.functions.invoke('analyze-transactions', {
          body: {
            transactions: data.transactions
          }
        });

        if (analysisError) {
          console.error('Analysis error:', analysisError);
          toast.error('Transactions fetched but analysis failed');
        } else {
          toast.success('Analysis complete! Check Dashboard for results.');
        }
      }
      
      setAddress("");
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast.error('Failed to fetch blockchain data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Blockchain Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="source">Blockchain</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">
            Address (optional - leave empty for latest transactions)
          </Label>
          <Input
            id="address"
            placeholder="0x... or 1A1zP1..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit">Number of Transactions</Label>
          <Input
            id="limit"
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleFetchData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            'Fetch Blockchain Data'
          )}
        </Button>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Ethereum: Connected via Infura</p>
          <p>• Bitcoin: Using public blockchain.info API</p>
          <p>• Transactions are analyzed automatically</p>
        </div>
      </CardContent>
    </Card>
  );
}
