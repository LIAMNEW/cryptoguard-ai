import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RiskAlertRequest {
  email: string;
  transactionId: string;
  riskScore: number;
  anomalyType?: string;
  amount?: number;
  fromAddress?: string;
  toAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Processing risk alert email request");
    
    const { 
      email, 
      transactionId, 
      riskScore, 
      anomalyType,
      amount,
      fromAddress,
      toAddress
    }: RiskAlertRequest = await req.json();

    console.log(`Sending alert to ${email} for transaction ${transactionId} with risk score ${riskScore}`);

    const emailResponse = await resend.emails.send({
      from: "QuantumGuard AI <onboarding@resend.dev>",
      to: [email],
      subject: `⚠️ High Risk Transaction Alert - Score: ${riskScore}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">
            🚨 High Risk Transaction Detected
          </h1>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <h2 style="color: #991b1b; margin-top: 0;">Risk Score: ${riskScore}</h2>
            <p style="color: #7f1d1d; margin: 5px 0;">
              <strong>Anomaly Type:</strong> ${anomalyType || 'Unknown'}
            </p>
          </div>

          <h3 style="color: #374151;">Transaction Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;"><strong>Transaction ID:</strong></td>
              <td style="padding: 10px; color: #111827;">${transactionId}</td>
            </tr>
            ${amount ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;"><strong>Amount:</strong></td>
              <td style="padding: 10px; color: #111827;">${amount}</td>
            </tr>
            ` : ''}
            ${fromAddress ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;"><strong>From Address:</strong></td>
              <td style="padding: 10px; color: #111827; font-family: monospace; font-size: 12px;">${fromAddress}</td>
            </tr>
            ` : ''}
            ${toAddress ? `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #6b7280;"><strong>To Address:</strong></td>
              <td style="padding: 10px; color: #111827; font-family: monospace; font-size: 12px;">${toAddress}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Recommended Actions:</h3>
            <ul style="color: #6b7280; line-height: 1.6;">
              <li>Review the transaction details immediately</li>
              <li>Check the network graph for related suspicious activity</li>
              <li>Consider flagging the involved addresses for further monitoring</li>
              <li>Document your findings in the audit log</li>
            </ul>
          </div>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated alert from QuantumGuard AI Platform. 
            You received this email because a high-risk transaction was detected in your monitored network.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending risk alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
