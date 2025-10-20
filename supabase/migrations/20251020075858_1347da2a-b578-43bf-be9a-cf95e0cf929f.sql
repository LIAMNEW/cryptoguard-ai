-- Fix RLS policy for transactions table to allow inserts from authenticated users
-- This allows the edge function (which runs with authenticated context) to insert transactions

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON transactions;

-- Allow authenticated users to insert transactions
CREATE POLICY "Enable insert for authenticated users only" 
ON transactions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to read their own transactions
CREATE POLICY "Enable read for authenticated users only" 
ON transactions FOR SELECT 
TO authenticated 
USING (true);