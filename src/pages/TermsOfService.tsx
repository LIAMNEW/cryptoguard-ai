import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Button>

        <Card className="glass-card p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: October 2, 2025</p>

          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using QuantumGuard AI ("the Service"), you accept and agree to be bound by the
                terms and provision of this agreement. If you do not agree to these Terms of Service, please do not
                use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                QuantumGuard AI provides blockchain transaction analysis, fraud detection, and compliance monitoring
                services. We use artificial intelligence and machine learning to analyze transaction patterns and
                identify potential risks.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to provide accurate and complete information when using the Service</li>
                <li>You will not use the Service for any illegal or unauthorized purpose</li>
                <li>You will not attempt to gain unauthorized access to any portion of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Usage and Privacy</h2>
              <p className="text-muted-foreground">
                Your use of the Service is also governed by our Privacy Policy. We collect and process transaction
                data solely for the purpose of providing analysis and compliance services. We implement
                industry-standard security measures to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, and functionality of the Service are owned by QuantumGuard AI and are
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                The Service is provided "as is" without warranties of any kind. QuantumGuard AI shall not be liable
                for any indirect, incidental, special, consequential, or punitive damages resulting from your use of
                the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Compliance and Regulatory</h2>
              <p className="text-muted-foreground">
                While our Service provides compliance analysis and risk assessment, users are solely responsible for
                ensuring their own compliance with applicable laws and regulations, including but not limited to
                AUSTRAC requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Service Modifications</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or discontinue the Service at any time, with or without notice. We
                shall not be liable to you or any third party for any modification, suspension, or discontinuance of
                the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your access to the Service immediately, without prior notice, for any
                reason whatsoever, including breach of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of Australia, without
                regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="text-muted-foreground">
                For any questions about these Terms of Service, please contact us at legal@quantumguard.ai
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
