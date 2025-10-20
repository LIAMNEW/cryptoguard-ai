import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { uploadTransactions } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/auditLog";
import { initializeQuantumSafeKeys } from "@/lib/quantumCrypto";
import { toast } from "sonner";
import { CommandSearch } from "@/components/navigation/CommandSearch";
import { Session, User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("analytics");
  const [hasData, setHasData] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Authentication check
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Initialize quantum-safe encryption keys on mount
  useEffect(() => {
    if (!user) return;
    
    const initKeys = async () => {
      try {
        await initializeQuantumSafeKeys();
        console.log('🔐 Quantum-safe encryption initialized');
      } catch (error) {
        console.error('Failed to initialize quantum-safe keys:', error);
        toast.error('Failed to initialize security features');
      }
    };
    initKeys();
  }, [user]);

  const handleFileUpload = useCallback(async (data: { fileContent: string; fileName: string }) => {
    const startTime = Date.now();
    
    try {
      console.log('Processing file with unified analysis pipeline...');
      
      // Show initial toast
      toast.info(`📄 Processing ${data.fileName}...`, { duration: 2000 });
      
      // Calculate estimated chunks
      const estimatedChunks = Math.ceil(data.fileContent.length / 50000);
      if (estimatedChunks > 1) {
        toast.info(`📦 Large file detected - processing in ${estimatedChunks} chunks`, { duration: 3000 });
      }
      
      // Show AI analysis progress
      const analysisToast = toast.loading('🤖 QuantumGuard AI extracting transactions...', { duration: 30000 });
      
      // Extract transactions using LLM with chunking
      const { data: extractResult, error: extractError } = await supabase.functions.invoke('llm-analyze-transactions', {
        body: data
      });

      toast.dismiss(analysisToast);

      if (extractError) throw extractError;

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Log audit event
      await logAuditEvent({
        action: "file_analyzed",
        resourceType: "transactions",
        details: {
          fileName: data.fileName,
          total_transactions: extractResult.total_transactions,
          new_transactions: extractResult.new_transactions,
          duplicates: extractResult.duplicates,
          high_risk_count: extractResult.high_risk_count,
          processingTimeSeconds: processingTime,
          timestamp: new Date().toISOString(),
        },
      });

      // Success message with details
      if (extractResult.duplicates > 0) {
        toast.success(
          `✅ Analyzed ${extractResult.total_transactions} transactions (${extractResult.new_transactions} new, ${extractResult.duplicates} duplicates skipped) in ${processingTime}s`,
          { duration: 6000 }
        );
      } else {
        toast.success(
          `✅ Successfully analyzed ${extractResult.total_transactions} transactions in ${processingTime}s`,
          { duration: 6000 }
        );
      }

      // High risk alert
      if (extractResult.high_risk_count > 0) {
        toast.error(
          `⚠️ ${extractResult.high_risk_count} high-risk transactions require immediate attention`,
          { duration: 8000 }
        );
      }

      // Pattern detection alerts
      if (extractResult.patterns) {
        const patterns = [];
        if (extractResult.patterns.structuring_detected) patterns.push('Structuring');
        if (extractResult.patterns.velocity_abuse) patterns.push('Velocity Abuse');
        if (extractResult.patterns.high_value_detected) patterns.push('High Value');
        
        if (patterns.length > 0) {
          toast.warning(`🔍 Patterns detected: ${patterns.join(', ')}`, { duration: 8000 });
        }
      }
      
      setHasData(true);
      setActiveSection("analytics");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('Upload error:', error);
      
      // Log error event
      await logAuditEvent({
        action: "file_analysis_failed",
        resourceType: "transactions",
        details: {
          fileName: data.fileName,
          error: errorMsg,
        },
      });
      
      // Provide helpful error messages based on error type
      if (errorMsg.includes('timeout') || errorMsg.includes('Failed to fetch') || errorMsg.includes('timed out')) {
        toast.error('⏱️ Analysis timeout - The AI service is taking too long. Please try again or use a smaller file.', { duration: 8000 });
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        toast.error('🚦 Rate limit reached - please wait a moment and try again.', { duration: 6000 });
      } else if (errorMsg.includes('No transactions found')) {
        toast.error('❌ No valid transactions found in file. Check file format.', { duration: 6000 });
      } else if (errorMsg.includes('Failed to send a request')) {
        toast.error('🔌 Connection error - Please check your internet connection and try again.', { duration: 6000 });
      } else {
        toast.error(`❌ Analysis failed: ${errorMsg}`, { duration: 6000 });
      }
    }
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-quantum-green border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          userEmail={user?.email}
        />
        <div className="flex-1 flex flex-col">
          {/* Command Search Bar */}
          <div className="p-4 border-b border-border bg-card/30 backdrop-blur">
            <div className="max-w-7xl mx-auto">
              <CommandSearch onNavigate={setActiveSection} />
            </div>
          </div>
          
          <MainContent
            activeSection={activeSection}
            hasData={hasData}
            onFileUpload={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
