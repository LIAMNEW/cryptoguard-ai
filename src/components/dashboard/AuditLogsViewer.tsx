import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuditLogs } from "@/lib/auditLog";
import { Clock, User, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getAuditLogs(50);
      setLogs(data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("failed") || action.includes("error")) return "destructive";
    if (action.includes("delete")) return "secondary";
    return "outline";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("upload")) return "📤";
    if (action.includes("save")) return "💾";
    if (action.includes("delete")) return "🗑️";
    if (action.includes("export")) return "📥";
    return "📝";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-quantum-green border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
        <p className="text-muted-foreground">System activity and user actions (last 50 events)</p>
      </div>

      {logs.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No audit logs available</p>
        </Card>
      ) : (
        <Card className="glass-card p-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bg-glass-background border border-glass-border hover:border-quantum-green/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                        <span className="font-medium text-foreground capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <Badge variant={getActionBadgeVariant(log.action)}>{log.resource_type}</Badge>
                      </div>

                      {log.details && (
                        <div className="text-sm text-muted-foreground">
                          {log.details.count && <span>Count: {log.details.count} | </span>}
                          {log.details.error && <span className="text-red-400">Error: {log.details.error}</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                        {log.user_id && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            User: {log.user_id.slice(0, 8)}...
                          </div>
                        )}
                        {log.resource_id && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            ID: {log.resource_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
