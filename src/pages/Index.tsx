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
  const [activeSection, setActiveSection] = useState("upload");
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
    try {
      console.log('Processing file with unified analysis pipeline...');
      
      // First, extract transactions using LLM
      const { data: extractResult, error: extractError } = await supabase.functions.invoke('llm-analyze-transactions', {
        body: data
      });

      if (extractError) throw extractError;

      // Log audit event
      await logAuditEvent({
        action: "unified_analyze_transactions",
        resourceType: "transactions",
        details: {
          fileName: data.fileName,
          total_transactions: extractResult.total_transactions,
          high_risk_count: extractResult.high_risk_count,
          timestamp: new Date().toISOString(),
        },
      });

      const riskSummary = [];
      if (extractResult.high_risk_count > 0) {
        riskSummary.push(`⚠️ ${extractResult.high_risk_count} HIGH RISK`);
      }

      toast.success(
        `Analysis Complete! ${extractResult.total_transactions} transactions processed${riskSummary.length > 0 ? ': ' + riskSummary.join(', ') : ''}`,
        { duration: 6000 }
      );

      if (extractResult.patterns) {
        const patterns = [];
        if (extractResult.patterns.structuring_detected) patterns.push('Structuring');
        if (extractResult.patterns.velocity_abuse) patterns.push('Velocity Abuse');
        if (extractResult.patterns.circular_transactions) patterns.push('Circular Flow');
        if (extractResult.patterns.unusual_timing) patterns.push('Unusual Timing');
        
        if (patterns.length > 0) {
          toast.warning(`Patterns detected: ${patterns.join(', ')}`, { duration: 8000 });
        }
      }
      
      setHasData(true);
      setActiveSection("dashboard");
    } catch (error) {
      toast.error('AI analysis failed. Please check your file format and try again.');
      console.error('Upload error:', error);
      
      // Log error event
      await logAuditEvent({
        action: "llm_analyze_failed",
        resourceType: "transactions",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
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
