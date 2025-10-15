import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { uploadTransactions } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/auditLog";
import { initializeQuantumSafeKeys } from "@/lib/quantumCrypto";
import { toast } from "sonner";
import { TeamPresence } from "@/components/realtime/TeamPresence";
import { LiveTransactionFeed } from "@/components/realtime/LiveTransactionFeed";
import { RiskAlertMonitor } from "@/components/realtime/RiskAlertMonitor";
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

  const handleFileUpload = useCallback(async (transactions: any[]) => {
    try {
      const result = await uploadTransactions(transactions);
      
      // Log audit event
      await logAuditEvent({
        action: "upload_transactions",
        resourceType: "transactions",
        details: {
          count: transactions.length,
          timestamp: new Date().toISOString(),
        },
      });
      
      toast.success(`${transactions.length} transactions uploaded and analyzed successfully!`);
      setHasData(true);
      setActiveSection("dashboard");
    } catch (error) {
      toast.error('Failed to upload transactions. Please try again.');
      console.error('Upload error:', error);
      
      // Log error event
      await logAuditEvent({
        action: "upload_transactions_failed",
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
          {/* Real-time Collaboration Panel */}
          <div className="p-4 border-b border-border bg-card/30 backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TeamPresence />
              <LiveTransactionFeed />
              <RiskAlertMonitor />
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
