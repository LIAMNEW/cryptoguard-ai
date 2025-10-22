import { useState } from "react";
import { 
  Shield, 
  Upload, 
  BarChart3,
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  { id: "risk-score", label: "Risk Score", icon: BarChart3 },
  { id: "ai-insights", label: "AI Insights", icon: Shield },
  { id: "reports", label: "Export", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings }
];

export function Sidebar({ activeSection, onSectionChange, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-quantum-green" />
            <span className="font-bold text-lg text-quantum-green">QuantumGuard</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-all",
                collapsed && "justify-center px-0"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 space-y-2">
        {!collapsed && userEmail && (
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="truncate">{userEmail}</span>
          </div>
        )}
        <Button
          variant="outline"
          className={cn("w-full gap-2", collapsed && "px-0 justify-center")}
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </aside>
  );
}
