import { Shield, Lock, Key, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuantumCryptoTest } from "@/components/security/QuantumCryptoTest";

export default function SecurityInfo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-quantum-green/10 border-2 border-quantum-green">
            <Shield className="w-8 h-8 text-quantum-green" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Quantum-Safe Security
          </h1>
          <p className="text-xl text-muted-foreground">
            Military-grade, post-quantum cryptography protecting your transaction data
          </p>
        </div>

        {/* Quantum Crypto Test */}
        <QuantumCryptoTest />

        {/* Threat Overview */}
        <Card className="glass-card p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                The Quantum Threat
              </h2>
              <p className="text-muted-foreground mb-4">
                Quantum computers pose an existential threat to current cryptographic systems. 
                Algorithms like RSA, ECC, and Diffie-Hellman that secure today's internet will become 
                vulnerable to quantum attacks within the next decade.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-400">
                  <strong>Store Now, Decrypt Later:</strong> Adversaries are already harvesting 
                  encrypted data today to decrypt it once quantum computers become available.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Our Solution */}
        <Card className="glass-card p-6 border-quantum-green/30">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-quantum-green mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                QuantumGuard Protection
              </h2>
              <p className="text-muted-foreground mb-6">
                We implement NIST-standardized post-quantum cryptographic algorithms to ensure 
                your data remains secure in the quantum era.
              </p>

              <div className="space-y-4">
                {/* CRYSTALS-Kyber */}
                <div className="border-l-4 border-quantum-green pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-5 h-5 text-quantum-green" />
                    <h3 className="font-semibold text-foreground">CRYSTALS-Kyber-1024</h3>
                    <Badge className="bg-quantum-green text-background">NIST Standard</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Post-quantum key encapsulation mechanism (KEM) based on the hardness of 
                    Module Learning With Errors (MLWE) problem.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Security Level: NIST Level 5 (highest)</li>
                    <li>• Standardized as ML-KEM in FIPS 203</li>
                    <li>• Resistant to Shor's algorithm and other quantum attacks</li>
                  </ul>
                </div>

                {/* AES-256-GCM */}
                <div className="border-l-4 border-quantum-green pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-quantum-green" />
                    <h3 className="font-semibold text-foreground">AES-256-GCM</h3>
                    <Badge className="bg-quantum-green text-background">Quantum-Resistant</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Advanced symmetric encryption with authenticated encryption mode providing 
                    both confidentiality and integrity.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 256-bit key size (quantum-safe with Grover's algorithm consideration)</li>
                    <li>• Authenticated encryption prevents tampering</li>
                    <li>• Used by government and military applications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-quantum-green/20 flex items-center justify-center">
                <span className="text-sm font-bold text-quantum-green">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Key Generation</h3>
                <p className="text-sm text-muted-foreground">
                  When you first use QuantumGuard, we generate a quantum-safe key pair using 
                  CRYSTALS-Kyber-1024 algorithm locally on your device.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-quantum-green/20 flex items-center justify-center">
                <span className="text-sm font-bold text-quantum-green">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">File Upload Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  When you upload transaction data, it's immediately encrypted using hybrid 
                  cryptography: Kyber for key exchange and AES-256-GCM for data encryption.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-quantum-green/20 flex items-center justify-center">
                <span className="text-sm font-bold text-quantum-green">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Secure Transit</h3>
                <p className="text-sm text-muted-foreground">
                  Encrypted data is transmitted over secure channels. Even if intercepted, 
                  the data remains protected against both classical and quantum attacks.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-quantum-green/20 flex items-center justify-center">
                <span className="text-sm font-bold text-quantum-green">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Authorized Access Only</h3>
                <p className="text-sm text-muted-foreground">
                  Only holders of the corresponding private key can decrypt and access the data. 
                  The decryption happens securely on your device.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Standards & Compliance */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Standards & Compliance
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">NIST PQC</h3>
              <p className="text-sm text-muted-foreground">
                Compliant with NIST's Post-Quantum Cryptography standardization project
              </p>
            </div>
            <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">FIPS 203</h3>
              <p className="text-sm text-muted-foreground">
                Implements ML-KEM as standardized in FIPS 203
              </p>
            </div>
            <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">Future-Proof</h3>
              <p className="text-sm text-muted-foreground">
                Protected against attacks from both current and future quantum computers
              </p>
            </div>
            <div className="p-4 rounded-lg bg-glass-background border border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">Open Source</h3>
              <p className="text-sm text-muted-foreground">
                Built on peer-reviewed, open-source cryptographic implementations
              </p>
            </div>
          </div>
        </Card>

        {/* FAQs */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Why do I need quantum-safe encryption now?
              </h3>
              <p className="text-sm text-muted-foreground">
                The "harvest now, decrypt later" threat means adversaries are collecting encrypted 
                data today to decrypt once quantum computers are available. Protecting your data 
                with quantum-safe encryption now ensures it remains secure in the future.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Does this impact performance?
              </h3>
              <p className="text-sm text-muted-foreground">
                CRYSTALS-Kyber is designed for efficiency. The encryption and decryption processes 
                add minimal overhead and are completed in milliseconds on modern devices.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Is my data safe from all attacks?
              </h3>
              <p className="text-sm text-muted-foreground">
                Quantum-safe cryptography protects against mathematical attacks from quantum computers. 
                As with all security systems, proper key management and device security remain important.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
