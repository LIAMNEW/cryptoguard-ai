-- AUSTRAC Compliance Scoring System
-- Based on AUSTRAC SMR Reference Guide March 2025

-- Rule Catalog for AUSTRAC compliance
CREATE TABLE IF NOT EXISTS public.rule_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  weight INTEGER NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MED', 'HIGH', 'CRITICAL')),
  must_report BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  austrac_indicator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced Scorecards with AUSTRAC compliance
CREATE TABLE IF NOT EXISTS public.transaction_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  policy_score INTEGER NOT NULL DEFAULT 0,
  ml_score FLOAT,
  final_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('NORMAL', 'EDD', 'SMR')),
  mandatory_flags JSONB DEFAULT '[]'::jsonb,
  due_by_ts TIMESTAMPTZ,
  indicators JSONB DEFAULT '{}'::jsonb,
  rules_triggered JSONB DEFAULT '[]'::jsonb,
  rationale TEXT,
  austrac_compliance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMR Drafts for automatic report generation
CREATE TABLE IF NOT EXISTS public.smr_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  scorecard_id UUID REFERENCES public.transaction_scorecards(id),
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'READY', 'SUBMITTED', 'REJECTED')) DEFAULT 'DRAFT',
  crime_type TEXT,
  suspicion_description TEXT,
  customer_profile TEXT,
  unusual_activity TEXT,
  analysis_conclusion TEXT,
  due_by_ts TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer risk profiles with KYC data
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_identifier TEXT UNIQUE NOT NULL,
  kyc_data JSONB DEFAULT '{}'::jsonb,
  risk_profile JSONB DEFAULT '{}'::jsonb,
  occupation TEXT,
  income_bracket TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  phones JSONB DEFAULT '[]'::jsonb,
  emails JSONB DEFAULT '[]'::jsonb,
  risk_rating TEXT CHECK (risk_rating IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  prior_alerts_count INTEGER DEFAULT 0,
  last_kyc_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- High-risk jurisdictions list
CREATE TABLE IF NOT EXISTS public.high_risk_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT UNIQUE NOT NULL,
  country_name TEXT NOT NULL,
  risk_category TEXT NOT NULL CHECK (risk_category IN ('SANCTIONS', 'HIGH_RISK', 'TF_CONCERN')),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rule_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smr_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.high_risk_jurisdictions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access to rule_catalog"
  ON public.rule_catalog FOR SELECT USING (true);

CREATE POLICY "Allow public read access to transaction_scorecards"
  ON public.transaction_scorecards FOR SELECT USING (true);

CREATE POLICY "Allow public read access to smr_drafts"
  ON public.smr_drafts FOR SELECT USING (true);

CREATE POLICY "Allow public read access to customer_profiles"
  ON public.customer_profiles FOR SELECT USING (true);

CREATE POLICY "Allow public read access to high_risk_jurisdictions"
  ON public.high_risk_jurisdictions FOR SELECT USING (true);

-- Insert access policies
CREATE POLICY "Allow public insert to transaction_scorecards"
  ON public.transaction_scorecards FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to smr_drafts"
  ON public.smr_drafts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to customer_profiles"
  ON public.customer_profiles FOR INSERT WITH CHECK (true);

-- Update triggers
CREATE TRIGGER update_rule_catalog_updated_at
  BEFORE UPDATE ON public.rule_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smr_drafts_updated_at
  BEFORE UPDATE ON public.smr_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed rule catalog with AUSTRAC indicators
INSERT INTO public.rule_catalog (rule_id, name, description, weight, severity, must_report, austrac_indicator) VALUES
  ('STRUCT_CASH', 'Cash Structuring', 'Multiple cash deposits just under reporting threshold within 7 days', 25, 'HIGH', false, 'Structuring transactions to avoid reporting thresholds'),
  ('LAYERING', 'Transaction Layering', 'Multiple onward transfers to new counterparties within 48h', 25, 'HIGH', false, 'Layering - rapid movement of funds'),
  ('HIGH_RISK_GEO', 'High-Risk Jurisdiction', 'Transaction involving high-risk or sanctioned country', 20, 'HIGH', false, 'High-risk geographic locations'),
  ('SANCTIONS_HIT', 'Sanctions Match', 'Positive match against sanctions/PEP lists', 40, 'CRITICAL', true, 'Sanctions or PEP involvement'),
  ('VELOCITY_SPIKE', 'Velocity Anomaly', 'Transaction frequency or amount significantly above baseline', 15, 'MED', false, 'Unusual transaction frequency or amounts'),
  ('KYC_MISMATCH', 'KYC Inconsistency', 'Recent identity changes or conflicting documentation', 15, 'MED', false, 'Suspicious identification or verification issues'),
  ('PROFILE_INCONSISTENT', 'Profile Mismatch', 'Activity inconsistent with occupation or declared income', 15, 'MED', false, 'Transactions inconsistent with customer profile'),
  ('RAPID_MOVEMENT', 'Rapid Fund Movement', 'Funds moved within hours of deposit', 20, 'HIGH', false, 'Unusually rapid fund movement'),
  ('CASH_INTENSIVE', 'High Cash Activity', 'Excessive cash deposits for business type', 15, 'MED', false, 'Unusual cash-intensive activity'),
  ('THIRD_PARTY', 'Third Party Transactions', 'Multiple third-party deposits or payments', 12, 'MED', false, 'Use of third parties to conduct transactions')
ON CONFLICT (rule_id) DO NOTHING;

-- Seed high-risk jurisdictions (examples)
INSERT INTO public.high_risk_jurisdictions (country_code, country_name, risk_category) VALUES
  ('AF', 'Afghanistan', 'HIGH_RISK'),
  ('IR', 'Iran', 'SANCTIONS'),
  ('KP', 'North Korea', 'SANCTIONS'),
  ('SY', 'Syria', 'SANCTIONS'),
  ('MM', 'Myanmar', 'HIGH_RISK'),
  ('PK', 'Pakistan', 'TF_CONCERN')
ON CONFLICT (country_code) DO NOTHING;