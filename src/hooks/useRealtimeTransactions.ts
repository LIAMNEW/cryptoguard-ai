import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  timestamp: string;
  transaction_type?: string;
}

export const useRealtimeTransactions = () => {
  const [realtimeTransactions, setRealtimeTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    console.log('🔴 Setting up realtime subscription for transactions');
    
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('✨ New transaction received:', payload.new);
          const newTransaction = payload.new as Transaction;
          
          setRealtimeTransactions(prev => [newTransaction, ...prev].slice(0, 50));
          
          toast({
            title: "New Transaction Detected",
            description: `${newTransaction.amount} transferred from ${newTransaction.from_address.slice(0, 8)}...`,
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return { realtimeTransactions };
};
