import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: October 2, 2025</p>

          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-3">
                We collect information you provide directly to us and information automatically collected when you
                use our Service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Transaction data uploaded for analysis</li>
                <li>Account information (email, name)</li>
                <li>Usage data and analytics</li>
                <li>Device and browser information</li>
                <li>IP addresses and location data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide and maintain our Service</li>
                <li>Analyze blockchain transactions for fraud and compliance risks</li>
                <li>Improve and optimize our AI algorithms</li>
                <li>Send important notifications about your analyses</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure cloud infrastructure with backup systems</li>
                <li>Post-quantum cryptography implementation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-3">
                We do not sell your personal information. We may share your information only in the following
                circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or law enforcement requests</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>With service providers who assist in our operations (under strict confidentiality)</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your transaction data for as long as necessary to provide our Service and comply with
                regulatory requirements. Audit logs are retained for 90 days. You may request deletion of your data
                at any time, subject to legal retention requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to improve your experience, analyze usage patterns,
                and provide personalized features. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of
                residence. We ensure appropriate safeguards are in place to protect your data in accordance with
                applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our Service is not directed to individuals under 18 years of age. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by
                posting the new policy and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground">
                For questions about this Privacy Policy or to exercise your rights, contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@quantumguard.ai
                <br />
                Address: QuantumGuard AI, Sydney, Australia
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
