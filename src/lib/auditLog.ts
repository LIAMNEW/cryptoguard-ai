import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent({
  action,
  resourceType,
  resourceId,
  details,
}: AuditLogEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user agent and IP would need backend support for real IP
    const userAgent = navigator.userAgent;
    
    await (supabase as any).from("audit_logs").insert({
      user_id: user?.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging shouldn't break the app
  }
}

export async function getAuditLogs(limit: number = 100) {
  try {
    const { data, error } = await (supabase as any)
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
