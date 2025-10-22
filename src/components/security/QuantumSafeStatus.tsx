import { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { getPublicKey } from "@/lib/quantumCrypto";

export function QuantumSafeStatus() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkKeys = () => {
      const publicKey = getPublicKey();
      setIsInitialized(!!publicKey);
    };
    
    checkKeys();
    // Recheck every second for first 5 seconds
    const interval = setInterval(checkKeys, 1000);
    setTimeout(() => clearInterval(interval), 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-xs font-medium text-yellow-500">
          Initializing encryption...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-quantum-green/10 border border-quantum-green/30">
      <Shield className="w-4 h-4 text-quantum-green" />
      <span className="text-xs font-medium text-quantum-green">
        Quantum-Safe Active
      </span>
      <CheckCircle className="w-3 h-3 text-quantum-green" />
    </div>
  );
}
