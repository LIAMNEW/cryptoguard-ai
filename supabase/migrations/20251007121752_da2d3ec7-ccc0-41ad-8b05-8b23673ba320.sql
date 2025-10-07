-- Enable realtime updates for transactions table
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Enable realtime updates for analysis_results table
ALTER TABLE public.analysis_results REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_results;