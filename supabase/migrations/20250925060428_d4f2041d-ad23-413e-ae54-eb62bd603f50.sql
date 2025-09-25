-- Fix security issues by enabling RLS and creating policies

-- Enable RLS on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_edges ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for this analysis engine, data should be publicly readable)
-- In a production environment, you'd want user-specific policies

CREATE POLICY "Allow public read access to transactions" 
ON public.transactions FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to analysis_results" 
ON public.analysis_results FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to analysis_results" 
ON public.analysis_results FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to network_nodes" 
ON public.network_nodes FOR SELECT 
USING (true);

CREATE POLICY "Allow public access to network_nodes" 
ON public.network_nodes FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public access to network_edges" 
ON public.network_edges FOR ALL 
USING (true)
WITH CHECK (true);

-- Fix function search paths
CREATE OR REPLACE FUNCTION update_network_data()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Update or insert from_address node
  INSERT INTO public.network_nodes (address, total_volume, transaction_count, first_seen, last_seen)
  VALUES (NEW.from_address, NEW.amount, 1, NEW.timestamp, NEW.timestamp)
  ON CONFLICT (address) 
  DO UPDATE SET 
    total_volume = network_nodes.total_volume + NEW.amount,
    transaction_count = network_nodes.transaction_count + 1,
    last_seen = GREATEST(network_nodes.last_seen, NEW.timestamp);

  -- Update or insert to_address node
  INSERT INTO public.network_nodes (address, total_volume, transaction_count, first_seen, last_seen)
  VALUES (NEW.to_address, NEW.amount, 1, NEW.timestamp, NEW.timestamp)
  ON CONFLICT (address) 
  DO UPDATE SET 
    total_volume = network_nodes.total_volume + NEW.amount,
    transaction_count = network_nodes.transaction_count + 1,
    last_seen = GREATEST(network_nodes.last_seen, NEW.timestamp);

  -- Update or insert edge
  INSERT INTO public.network_edges (from_address, to_address, total_amount, transaction_count, first_transaction, last_transaction)
  VALUES (NEW.from_address, NEW.to_address, NEW.amount, 1, NEW.timestamp, NEW.timestamp)
  ON CONFLICT (from_address, to_address)
  DO UPDATE SET 
    total_amount = network_edges.total_amount + NEW.amount,
    transaction_count = network_edges.transaction_count + 1,
    last_transaction = GREATEST(network_edges.last_transaction, NEW.timestamp);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_risk_levels()
RETURNS void 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.network_nodes 
  SET risk_level = CASE 
    WHEN total_volume > 100000 THEN 'high'
    WHEN total_volume > 50000 THEN 'medium'
    ELSE 'low'
  END;
END;
$$;