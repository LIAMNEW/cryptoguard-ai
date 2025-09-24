import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// API functions
export async function uploadTransactions(transactions: Transaction[]) {
  const { data, error } = await supabase.functions.invoke('analyze-transactions', {
    body: { transactions }
  })
  
  if (error) throw error
  return data
}

export async function getAnalysisOverview(): Promise<AnalysisOverview> {
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'overview' }
  })
  
  if (error) throw error
  return data
}

export async function getNetworkData(): Promise<{ nodes: NetworkNode[], links: NetworkLink[] }> {
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'network' }
  })
  
  if (error) throw error
  return data
}

export async function getTimelineData(): Promise<TimelineData[]> {
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'timeline' }
  })
  
  if (error) throw error
  return data
}

export async function getAnomaliesData(): Promise<AnomalyData[]> {
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'anomalies' }
  })
  
  if (error) throw error
  return data
}

export async function getRiskData() {
  const { data, error } = await supabase.functions.invoke('get-analysis-data', {
    body: { type: 'risk' }
  })
  
  if (error) throw error
  return data
}