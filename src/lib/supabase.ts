import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  transaction_hash?: string;
  block_number?: number;
  gas_fee?: number;
  transaction_type?: string;
}

export interface AnalysisOverview {
  totalTransactions: number;
  averageRiskScore: number;
  anomaliesFound: number;
  highRiskTransactions: number;
}

export interface NetworkNode {
  id: string;
  address: string;
  amount: number;
  riskLevel: string;
}

export interface NetworkLink {
  source: string;
  target: string;
  amount: number;
}

export interface TimelineData {
  timestamp: string;
  volume: number;
  riskScore: number;
  anomalies: number;
}

export interface AnomalyData {
  id: string;
  type: string;
  severity: string;
  description: string;
  transaction: any;
  riskScore: number;
  timestamp: string;
}

// API functions with error handling
export async function uploadTransactions(transactions: Transaction[]) {
  const { data, error } = await supabase.functions.invoke('analyze-transactions', {
    body: { transactions }
  })
  
  if (error) throw error
  return data
}

export async function getAnalysisOverview(): Promise<AnalysisOverview> {
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (error) throw error
  
  const response = await fetch(`https://zytdnqlnsahydanaeupc.supabase.co/functions/v1/get-analysis-data?type=overview`, {
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch overview data')
  return await response.json()
}

export async function getNetworkData(): Promise<{ nodes: NetworkNode[], links: NetworkLink[] }> {
  const response = await fetch(`https://zytdnqlnsahydanaeupc.supabase.co/functions/v1/get-analysis-data?type=network`, {
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch network data')
  return await response.json()
}

export async function getTimelineData(): Promise<TimelineData[]> {
  const response = await fetch(`https://zytdnqlnsahydanaeupc.supabase.co/functions/v1/get-analysis-data?type=timeline`, {
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch timeline data')
  return await response.json()
}

export async function getAnomaliesData(): Promise<AnomalyData[]> {
  const response = await fetch(`https://zytdnqlnsahydanaeupc.supabase.co/functions/v1/get-analysis-data?type=anomalies`, {
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch anomalies data')
  return await response.json()
}

export async function getRiskData() {
  const response = await fetch(`https://zytdnqlnsahydanaeupc.supabase.co/functions/v1/get-analysis-data?type=risk`, {
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg`,
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dGRucWxuc2FoeWRhbmFldXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODIyNzksImV4cCI6MjA3NDI1ODI3OX0.v3m5dbl3QAQthY-NwEsMtSImWXgoiMBKLp_WTz9-AUg'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch risk data')
  return await response.json()
}