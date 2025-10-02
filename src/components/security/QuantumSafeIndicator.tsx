import { Shield, Lock, Zap, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

export function QuantumSafeIndicator() {
  return (
    <Card className="glass-card p-6 border-quantum-green/30">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-quantum-green/10 border border-quantum-green/30">
          <Shield className="w-6 h-6 text-quantum-green" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-semibold text-foreground">
              Quantum-Ready Infrastructure
            </h4>
            <Badge variant="outline" className="border-quantum-green text-quantum-green">
              HTTPS + TLS 1.3
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your data is protected with TLS 1.3 encryption in transit and quantum-safe algorithms ready for deployment
          </p>
          
          <div className="grid gap-3">
            <TooltipProvider>
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-quantum-green" />
                <div className="flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm text-foreground cursor-help hover:text-quantum-green transition-colors">
                        CRYSTALS-Kyber-1024 (ML-KEM) ℹ️
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        NIST-standardized post-quantum key encapsulation mechanism. 
                        Resistant to attacks from both classical and quantum computers.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    Post-quantum key exchange
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-quantum-green" />
                <div className="flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm text-foreground cursor-help hover:text-quantum-green transition-colors">
                        AES-256-GCM ℹ️
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Advanced Encryption Standard with Galois/Counter Mode. 
                        Provides authenticated encryption with 256-bit security.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    Symmetric encryption
                  </p>
                </div>
              </div>
            </TooltipProvider>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-quantum-green/5 border border-quantum-green/20">
            <p className="text-xs text-muted-foreground mb-3">
              <span className="font-semibold text-quantum-green">Why this matters:</span>{" "}
              Future quantum computers will break traditional encryption (RSA, ECC). 
              Our quantum-safe approach ensures your data remains secure even against quantum attacks.
            </p>
            <Link to="/security">
              <Button variant="outline" size="sm" className="w-full border-quantum-green/30 text-quantum-green hover:bg-quantum-green/10">
                Learn More About Quantum Security
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
