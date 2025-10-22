import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { 
  generateQuantumSafeKeyPair, 
  encryptWithQuantumSafe, 
  decryptWithQuantumSafe 
} from "@/lib/quantumCrypto";
import { useToast } from "@/hooks/use-toast";

export function QuantumCryptoTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const { toast } = useToast();

  const runTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Step 1: Generate key pair
      console.log("🔑 Generating quantum-safe key pair...");
      const { publicKey, privateKey } = await generateQuantumSafeKeyPair();
      console.log("✅ Key pair generated", { 
        publicKeySize: publicKey.length, 
        privateKeySize: privateKey.length 
      });

      // Step 2: Test data
      const testData = {
        message: "Hello, Quantum World!",
        timestamp: new Date().toISOString(),
        amount: 1234.56
      };
      console.log("📝 Test data:", testData);

      // Step 3: Encrypt
      console.log("🔒 Encrypting data with ML-KEM-1024...");
      const encrypted = await encryptWithQuantumSafe(testData, publicKey);
      console.log("✅ Data encrypted", {
        encapsulatedKeySize: encrypted.encapsulatedKey.length,
        ciphertextSize: encrypted.ciphertext.length
      });

      // Step 4: Decrypt
      console.log("🔓 Decrypting data...");
      const decrypted = await decryptWithQuantumSafe(encrypted, privateKey);
      const decryptedData = JSON.parse(decrypted);
      console.log("✅ Data decrypted:", decryptedData);

      // Step 5: Verify
      const isValid = 
        decryptedData.message === testData.message &&
        decryptedData.timestamp === testData.timestamp &&
        decryptedData.amount === testData.amount;

      if (isValid) {
        setResult({
          success: true,
          message: "Quantum-safe encryption test passed!",
          details: `Successfully encrypted and decrypted: "${testData.message}"`
        });
        toast({
          title: "✅ Test Passed",
          description: "ML-KEM-1024 quantum-safe cryptography is working correctly",
        });
      } else {
        throw new Error("Decrypted data does not match original");
      }

    } catch (error) {
      console.error("❌ Quantum crypto test failed:", error);
      setResult({
        success: false,
        message: "Quantum-safe encryption test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="glass-card p-6 border-quantum-green/30">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-quantum-green/10 border border-quantum-green/30">
          <Shield className="w-6 h-6 text-quantum-green" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-foreground mb-2">
            Quantum Cryptography Test
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Test ML-KEM-1024 (CRYSTALS-Kyber) encryption and decryption
          </p>

          <Button 
            onClick={runTest} 
            disabled={testing}
            className="mb-4"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Test
              </>
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-quantum-green/5 border-quantum-green/30' 
                : 'bg-destructive/5 border-destructive/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-quantum-green" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className={`font-semibold ${
                  result.success ? 'text-quantum-green' : 'text-destructive'
                }`}>
                  {result.message}
                </span>
              </div>
              {result.details && (
                <p className="text-sm text-muted-foreground">{result.details}</p>
              )}
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Test Process:</span>
              <br />
              1. Generate ML-KEM-1024 key pair (~1568 byte public, ~3168 byte private)
              <br />
              2. Encrypt test data with public key
              <br />
              3. Decrypt with private key using AES-256-GCM
              <br />
              4. Verify decrypted data matches original
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
