import { createClient } from '@supabase/supabase-js'

// Debug: Check what environment variables are available
console.log('Available env vars:', import.meta.env);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing. Please ensure your Supabase integration is properly set up.');
  console.error('Missing:', {
    url: !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
    key: !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null
  });
}

// Create a mock client if environment variables are missing (for development)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your Supabase connection.');
  }
  
  const { data, error } = await supabase.functions.invoke('analyze-transactions', {
    body: { transactions }
  })
  
  if (error) throw error
  return data
}

export async function getAnalysisOverview(): Promise<AnalysisOverview> {
  if (!supabase) {
    // Return mock data when Supabase is not available
    return {
      totalTransactions: 0,
      averageRiskScore: 0,
      anomaliesFound: 0,
      highRiskTransactions: 0
    };
  }
  
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'overview' }
  })
  
  if (error) throw error
  return data
}

export async function getNetworkData(): Promise<{ nodes: NetworkNode[], links: NetworkLink[] }> {
  if (!supabase) {
    return { nodes: [], links: [] };
  }
  
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'network' }
  })
  
  if (error) throw error
  return data
}

export async function getTimelineData(): Promise<TimelineData[]> {
  if (!supabase) {
    return [];
  }
  
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'timeline' }
  })
  
  if (error) throw error
  return data
}

export async function getAnomaliesData(): Promise<AnomalyData[]> {
  if (!supabase) {
    return [];
  }
  
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'anomalies' }
  })
  
  if (error) throw error
  return data
}

export async function getRiskData() {
  if (!supabase) {
    return { low: 0, medium: 0, high: 0, critical: 0 };
  }
  
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'risk' }
  })
  
  if (error) throw error
  return data
}