// Rate limiting utility for edge functions
// This provides helper functions to implement rate limiting

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  "ai-chat": { maxRequests: 50, windowMs: 60000 }, // 50 per minute
  "analyze-transactions": { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  "send-risk-alert": { maxRequests: 5, windowMs: 60000 }, // 5 per minute
};

export async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS[endpoint] || { maxRequests: 100, windowMs: 60000 }
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - config.windowMs);
  
  try {
    // Get current count for this identifier and endpoint
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("request_count, window_start")
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("Rate limit check error:", fetchError);
      return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMs) };
    }

    if (existing) {
      const currentCount = existing.request_count;
      
      if (currentCount >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMs),
        };
      }

      // Increment counter
      await supabase
        .from("rate_limits")
        .update({ request_count: currentCount + 1 })
        .eq("identifier", identifier)
        .eq("endpoint", endpoint)
        .eq("window_start", existing.window_start);

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount - 1,
        resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMs),
      };
    }

    // Create new rate limit entry
    await supabase.from("rate_limits").insert({
      identifier,
      endpoint,
      request_count: 1,
      window_start: new Date(),
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // On error, allow the request
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMs) };
  }
}
