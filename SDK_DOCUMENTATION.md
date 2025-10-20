# QuantumGuard AI - Complete SDK Documentation

## Project Overview
QuantumGuard AI is an advanced financial transaction analysis platform with AI-powered fraud detection, blockchain integration, and AUSTRAC compliance features.

## Table of Contents
1. [Supabase Client Setup](#supabase-client-setup)
2. [Database Schema](#database-schema)
3. [Edge Functions](#edge-functions)
4. [Frontend Components](#frontend-components)
5. [Utility Libraries](#utility-libraries)
6. [Authentication](#authentication)

---

## Supabase Client Setup

### Import the Client
```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Configuration
- **Project URL**: `https://zytdnqlnsahydanaeupc.supabase.co`
- **Anon Key**: Available in `src/integrations/supabase/client.ts`
- Pre-configured with:
  - localStorage for session storage
  - Auto token refresh
  - Session persistence

---

## Database Schema

### Tables

#### `transactions`
Main transaction data storage
```typescript
interface Transaction {
  id: uuid;
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  transaction_hash?: string;
  block_number?: number;
  gas_fee?: number;
  transaction_type?: string;
  created_at: timestamp;
}
```

**Usage:**
```typescript
// Query transactions
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .limit(100);

// Insert transaction
const { data, error } = await supabase
  .from('transactions')
  .insert({
    transaction_id: 'tx_123',
    from_address: '0x123...',
    to_address: '0x456...',
    amount: 1000,
    timestamp: new Date().toISOString()
  });
```

#### `transaction_scorecards`
Risk scoring and compliance data
```typescript
interface TransactionScorecard {
  id: uuid;
  transaction_id: uuid;
  policy_score: number;
  ml_score?: number;
  final_score: number;
  risk_level: 'NORMAL' | 'EDD' | 'SMR';
  mandatory_flags?: string[];
  due_by_ts?: timestamp;
  indicators?: jsonb;
  rules_triggered?: jsonb;
  rationale?: string;
  austrac_compliance?: jsonb;
  created_at: timestamp;
}
```

**Usage:**
```typescript
// Get scorecard for transaction
const { data, error } = await supabase
  .from('transaction_scorecards')
  .select('*')
  .eq('transaction_id', transactionId)
  .single();
```

#### `analysis_results`
Analysis outcomes and anomaly detection
```typescript
interface AnalysisResult {
  id: uuid;
  transaction_id: uuid;
  risk_score: number;
  anomaly_detected: boolean;
  anomaly_type?: string;
  network_cluster?: string;
  austrac_score?: number;
  general_risk_score?: number;
  risk_level?: string;
  created_at: timestamp;
}
```

#### `network_nodes`
Network visualization nodes
```typescript
interface NetworkNode {
  id: uuid;
  address: string;
  total_volume: number;
  transaction_count: number;
  risk_level: 'low' | 'medium' | 'high';
  first_seen?: timestamp;
  last_seen?: timestamp;
  created_at: timestamp;
}
```

#### `network_edges`
Network visualization edges
```typescript
interface NetworkEdge {
  id: uuid;
  from_address: string;
  to_address: string;
  total_amount: number;
  transaction_count: number;
  first_transaction?: timestamp;
  last_transaction?: timestamp;
  created_at: timestamp;
}
```

#### `profiles`
User profile data
```typescript
interface Profile {
  id: uuid;
  email: string;
  full_name?: string;
  company_name?: string;
  user_tier: 'free' | 'pro' | 'enterprise';
  email_notifications: boolean;
  high_risk_alerts: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### `audit_logs`
System audit trail
```typescript
interface AuditLog {
  id: uuid;
  user_id?: uuid;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: jsonb;
  ip_address?: string;
  user_agent?: string;
  created_at: timestamp;
}
```

#### `saved_analyses`
Saved analysis snapshots
```typescript
interface SavedAnalysis {
  id: uuid;
  name: string;
  description?: string;
  analysis_date: timestamp;
  total_transactions: number;
  high_risk_count: number;
  anomalies_count: number;
  average_risk_score?: number;
  snapshot_data: jsonb;
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## Edge Functions

### 1. `llm-analyze-transactions`
Extracts and analyzes transactions from uploaded files using AI.

**Endpoint:**
```typescript
supabase.functions.invoke('llm-analyze-transactions', {
  body: {
    fileContent: string,
    fileName: string
  }
})
```

**Request:**
```typescript
interface LLMAnalyzeRequest {
  fileContent: string;  // CSV, JSON, or TXT content
  fileName: string;     // Original filename
}
```

**Response:**
```typescript
interface LLMAnalyzeResponse {
  success: boolean;
  total_transactions: number;
  new_transactions: number;
  duplicates: number;
  high_risk_count: number;
  scorecards: TransactionScorecard[];
  patterns: {
    high_value_detected: boolean;
    structuring_detected: boolean;
    velocity_abuse: boolean;
  };
}
```

**Features:**
- Intelligent file format detection (CSV, JSON, XML, plain text)
- Chunked processing for large files
- Duplicate detection
- Automatic AI extraction
- Real-time progress updates

---

### 2. `unified-analyze`
Unified analysis pipeline for transaction scoring and storage.

**Endpoint:**
```typescript
supabase.functions.invoke('unified-analyze', {
  body: {
    transactions: Transaction[]
  }
})
```

**Request:**
```typescript
interface UnifiedAnalyzeRequest {
  transactions: Array<{
    transaction_id: string;
    from_address: string;
    to_address: string;
    amount: number;
    timestamp: string;
    transaction_type?: string;
  }>;
}
```

**Response:**
```typescript
interface UnifiedAnalyzeResponse {
  message: string;
  analyzed_count: number;
  scorecards: TransactionScorecard[];
  high_risk_count: number;
}
```

**Features:**
- Batch transaction processing
- AUSTRAC-compliant risk scoring
- Rule-based analysis
- Network graph updates
- High-value transaction detection

---

### 3. `fetch-blockchain-data`
Fetches live blockchain transactions from Ethereum or Bitcoin networks.

**Endpoint:**
```typescript
supabase.functions.invoke('fetch-blockchain-data', {
  body: {
    address: string,
    network: 'ethereum' | 'bitcoin'
  }
})
```

**Request:**
```typescript
interface FetchBlockchainRequest {
  address: string;
  network: 'ethereum' | 'bitcoin';
}
```

**Response:**
```typescript
interface FetchBlockchainResponse {
  transactions: Transaction[];
  analyzed_count: number;
  high_risk_count: number;
}
```

---

### 4. `ai-chat`
AI-powered chat interface for transaction analysis assistance.

**Endpoint:**
```typescript
supabase.functions.invoke('ai-chat', {
  body: {
    message: string,
    context?: any
  }
})
```

**Request:**
```typescript
interface AIChatRequest {
  message: string;
  context?: {
    transactions?: Transaction[];
    analysis?: any;
  };
}
```

**Response:**
```typescript
interface AIChatResponse {
  response: string;
  suggestions?: string[];
}
```

---

### 5. `generate-visual-report`
Generates PDF reports with charts and visualizations.

**Endpoint:**
```typescript
supabase.functions.invoke('generate-visual-report', {
  body: {
    transactions: Transaction[],
    analysis: AnalysisResult[],
    reportTitle?: string
  }
})
```

**Request:**
```typescript
interface VisualReportRequest {
  transactions: Transaction[];
  analysis: AnalysisResult[];
  reportTitle?: string;
}
```

**Response:**
```typescript
interface VisualReportResponse {
  pdfUrl: string;
  reportId: string;
}
```

---

### 6. `austrac-generate-smr`
Generates AUSTRAC-compliant Suspicious Matter Reports.

**Endpoint:**
```typescript
supabase.functions.invoke('austrac-generate-smr', {
  body: {
    transactionId: string
  }
})
```

---

## Frontend Components

### Core Layout Components

#### `Sidebar`
Main navigation sidebar
```typescript
import { Sidebar } from "@/components/layout/Sidebar";

<Sidebar 
  activeSection={string}
  onSectionChange={(section: string) => void}
  userEmail={string}
/>
```

#### `MainContent`
Main content area router
```typescript
import { MainContent } from "@/components/layout/MainContent";

<MainContent
  activeSection={string}
  hasData={boolean}
  onFileUpload={(data) => Promise<any>}
/>
```

### Analytics Components

#### `Analytics`
Main analytics dashboard
```typescript
import { Analytics } from "@/components/analytics/Analytics";

<Analytics 
  onFileUpload={(data) => Promise<any>}
  hasData={boolean}
/>
```

#### `AnalysisTabs`
Tabbed analysis views (Dashboard, Network, Reports)
```typescript
import { AnalysisTabs } from "@/components/dashboard/AnalysisTabs";

<AnalysisTabs />
```

### Real-time Components

#### `LiveTransactionFeed`
Real-time transaction monitoring
```typescript
import { LiveTransactionFeed } from "@/components/realtime/LiveTransactionFeed";

<LiveTransactionFeed />
```

#### `RiskAlertMonitor`
Real-time risk alerts
```typescript
import { RiskAlertMonitor } from "@/components/realtime/RiskAlertMonitor";

<RiskAlertMonitor />
```

---

## Utility Libraries

### Audit Logging
```typescript
import { logAuditEvent } from "@/lib/auditLog";

await logAuditEvent({
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: object
});
```

### Quantum-Safe Encryption
```typescript
import { 
  initializeQuantumSafeKeys,
  encryptData,
  decryptData 
} from "@/lib/quantumCrypto";

// Initialize keys
await initializeQuantumSafeKeys();

// Encrypt
const encrypted = await encryptData(plaintext);

// Decrypt
const decrypted = await decryptData(ciphertext);
```

### Rate Limiting
```typescript
import { checkRateLimit } from "@/lib/rateLimit";

const allowed = await checkRateLimit(identifier, endpoint, limit);
```

---

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: `${window.location.origin}/`
  }
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Auth State Listener
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event);
    console.log('Session:', session);
  }
);

// Cleanup
subscription.unsubscribe();
```

---

## Environment Variables

Available via `import.meta.env`:

```typescript
// Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY

// API Keys (stored in Supabase Secrets)
LOVABLE_API_KEY
OPENAI_API_KEY
INFURA_API_KEY
ETHERSCAN_API_KEY
MAXMIND_LICENSE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
```

---

## TypeScript Types

All database types are auto-generated in:
```typescript
import type { Database } from '@/integrations/supabase/types';

// Use like this:
type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
```

---

## Example: Complete Transaction Upload Flow

```typescript
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function uploadAndAnalyzeFile(file: File) {
  try {
    // 1. Read file content
    const fileContent = await file.text();
    
    // 2. Call LLM analysis
    toast.info('🤖 Analyzing file...');
    const { data, error } = await supabase.functions.invoke(
      'llm-analyze-transactions',
      {
        body: {
          fileContent,
          fileName: file.name
        }
      }
    );
    
    if (error) throw error;
    
    // 3. Show results
    toast.success(
      `✅ Analyzed ${data.total_transactions} transactions`
    );
    
    if (data.high_risk_count > 0) {
      toast.error(
        `⚠️ ${data.high_risk_count} high-risk transactions detected`
      );
    }
    
    // 4. Query results
    const { data: scorecards } = await supabase
      .from('transaction_scorecards')
      .select('*')
      .order('final_score', { ascending: false })
      .limit(10);
    
    return { transactions: data, scorecards };
    
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Failed to analyze file');
    throw error;
  }
}
```

---

## Security Best Practices

1. **Row Level Security (RLS)**: All tables have RLS enabled
2. **Quantum-Safe Encryption**: Use for sensitive data
3. **Audit Logging**: All critical actions are logged
4. **Rate Limiting**: Edge functions are rate-limited
5. **JWT Verification**: Edge functions verify authentication

---

## Support & Resources

- **Documentation**: See individual component files
- **Database Schema**: `src/integrations/supabase/types.ts`
- **Edge Functions**: `supabase/functions/*/index.ts`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/zytdnqlnsahydanaeupc

---

## Version Information

- **Supabase SDK**: v2.57.4
- **React**: v18.3.1
- **TypeScript**: Latest
- **Vite**: Latest

---

*Last Updated: 2025-10-20*
