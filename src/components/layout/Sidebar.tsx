import { useState } from "react";
import { 
  Shield, 
  Upload, 
  BarChart3, 
  Network, 
  AlertTriangle, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  ScrollText,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuantumSafeStatus } from "@/components/security/QuantumSafeStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail?: string;
}

const navigation = [
  { id: "upload", label: "Upload Data", icon: Upload },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "blockchain", label: "Live Blockchain Analysis", icon: Activity },
  { id: "saved", label: "Saved Analyses", icon: Settings },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: User },
];

export function Sidebar({ activeSection, onSectionChange, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn(
      "glass-card h-screen transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-quantum-green flex items-center justify-center">
                <Shield className="w-5 h-5 text-background" />
              </div>
              <div>
                <h2 className="text-quantum font-bold text-lg">QuantumGuard</h2>
                <p className="text-xs text-muted-foreground">AI Analytics</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-quantum-green"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-all duration-200",
                isActive && "bg-quantum-green text-background glow-effect",
                !isActive && "text-muted-foreground hover:text-quantum-green hover:bg-glass-background"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Security Status */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <QuantumSafeStatus />
        </div>
      )}

      {/* User Info & Logout */}
      <div className="p-4 border-t border-glass-border space-y-3">
        {!collapsed && userEmail && (
          <div className="text-xs text-muted-foreground truncate px-2">
            {userEmail}
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-red-500",
            collapsed && "justify-center"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>

      {/* System Status */}
      <div className="p-4 border-t border-glass-border">
        <div className={cn(
          "flex items-center gap-2 text-sm",
          collapsed ? "justify-center" : ""
        )}>
          <Activity className="w-4 h-4 text-quantum-green animate-pulse" />
          {!collapsed && (
            <div>
              <p className="text-quantum-green font-medium">System Online</p>
              <p className="text-xs text-muted-foreground">All services operational</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}