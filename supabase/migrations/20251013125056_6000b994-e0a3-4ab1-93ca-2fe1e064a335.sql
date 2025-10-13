-- Add new AUSTRAC and General Risk scoring columns to analysis_results table
ALTER TABLE public.analysis_results
ADD COLUMN IF NOT EXISTS austrac_score integer,
ADD COLUMN IF NOT EXISTS general_risk_score integer,
ADD COLUMN IF NOT EXISTS risk_level text;

-- Add check constraints for valid ranges
ALTER TABLE public.analysis_results
ADD CONSTRAINT austrac_score_range CHECK (austrac_score >= 0 AND austrac_score <= 100),
ADD CONSTRAINT general_risk_score_range CHECK (general_risk_score >= 0 AND general_risk_score <= 100),
ADD CONSTRAINT risk_level_valid CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analysis_results_risk_level ON public.analysis_results(risk_level);
CREATE INDEX IF NOT EXISTS idx_analysis_results_austrac_score ON public.analysis_results(austrac_score);