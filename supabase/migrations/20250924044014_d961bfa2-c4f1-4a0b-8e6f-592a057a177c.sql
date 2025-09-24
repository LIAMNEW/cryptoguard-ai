-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_hash TEXT,
  block_number BIGINT,
  gas_fee DECIMAL(20,8),
  transaction_type TEXT DEFAULT 'transfer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_results table
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  anomaly_detected BOOLEAN NOT NULL DEFAULT false,
  anomaly_type TEXT,
  network_cluster TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create network_nodes table
CREATE TABLE public.network_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  total_volume DECIMAL(20,8) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create network_edges table
CREATE TABLE public.network_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  total_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  first_transaction TIMESTAMP WITH TIME ZONE,
  last_transaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_address, to_address)
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_from_address ON public.transactions(from_address);
CREATE INDEX idx_transactions_to_address ON public.transactions(to_address);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp);
CREATE INDEX idx_analysis_results_transaction_id ON public.analysis_results(transaction_id);
CREATE INDEX idx_analysis_results_risk_score ON public.analysis_results(risk_score);
CREATE INDEX idx_network_nodes_address ON public.network_nodes(address);
CREATE INDEX idx_network_edges_addresses ON public.network_edges(from_address, to_address);

-- Create triggers to update network data automatically
CREATE OR REPLACE FUNCTION update_network_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_network_data_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_network_data();

-- Update risk levels based on transaction volume
CREATE OR REPLACE FUNCTION update_risk_levels()
RETURNS void AS $$
BEGIN
  UPDATE public.network_nodes 
  SET risk_level = CASE 
    WHEN total_volume > 100000 THEN 'high'
    WHEN total_volume > 50000 THEN 'medium'
    ELSE 'low'
  END;
END;
$$ LANGUAGE plpgsql;