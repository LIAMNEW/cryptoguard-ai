import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, address, limit = 10 } = await req.json();
    console.log('Fetching blockchain data:', { source, address, limit });

    const INFURA_API_KEY = Deno.env.get('INFURA_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let transactions = [];

    if (source === 'ethereum') {
      transactions = await fetchEthereumTransactions(address, INFURA_API_KEY!, limit);
    } else if (source === 'bitcoin') {
      transactions = await fetchBitcoinTransactions(address, limit);
    } else {
      throw new Error('Unsupported blockchain source');
    }

    // Store transactions in database
    if (transactions.length > 0) {
      const { error } = await supabase
        .from('transactions')
        .insert(transactions);

      if (error) {
        console.error('Error storing transactions:', error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: transactions.length, transactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-blockchain-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchEthereumTransactions(address: string, apiKey: string, limit: number) {
  const infuraUrl = `https://mainnet.infura.io/v3/${apiKey}`;
  
  // Get latest block number
  const blockResponse = await fetch(infuraUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    })
  });
  const blockData = await blockResponse.json();
  const latestBlock = parseInt(blockData.result, 16);

  // Fetch recent transactions for the address
  const transactions = [];
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const blockNum = `0x${(latestBlock - i).toString(16)}`;
    const txResponse = await fetch(infuraUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNum, true],
        id: 1
      })
    });
    
    const txData = await txResponse.json();
    if (txData.result?.transactions) {
      const filtered = txData.result.transactions
        .filter((tx: any) => 
          !address || 
          tx.from?.toLowerCase() === address.toLowerCase() || 
          tx.to?.toLowerCase() === address.toLowerCase()
        )
        .slice(0, limit - transactions.length)
        .map((tx: any) => ({
          transaction_id: tx.hash,
          from_address: tx.from || 'unknown',
          to_address: tx.to || 'contract',
          amount: parseInt(tx.value, 16) / 1e18,
          timestamp: new Date(parseInt(txData.result.timestamp, 16) * 1000).toISOString(),
          transaction_hash: tx.hash,
          block_number: parseInt(tx.blockNumber, 16),
          gas_fee: (parseInt(tx.gas, 16) * parseInt(tx.gasPrice || '0', 16)) / 1e18,
          transaction_type: 'ethereum'
        }));
      
      transactions.push(...filtered);
      if (transactions.length >= limit) break;
    }
  }

  return transactions.slice(0, limit);
}

async function fetchBitcoinTransactions(address: string, limit: number) {
  // Using blockchain.info public API
  const url = address 
    ? `https://blockchain.info/rawaddr/${address}?limit=${limit}`
    : `https://blockchain.info/latestblock`;

  const response = await fetch(url);
  const data = await response.json();

  if (!address) {
    // Fetch latest block transactions
    const blockResponse = await fetch(`https://blockchain.info/rawblock/${data.hash}`);
    const blockData = await blockResponse.json();
    
    return blockData.tx.slice(0, limit).map((tx: any) => ({
      transaction_id: tx.hash,
      from_address: tx.inputs[0]?.prev_out?.addr || 'coinbase',
      to_address: tx.out[0]?.addr || 'unknown',
      amount: tx.out[0]?.value / 1e8 || 0,
      timestamp: new Date(tx.time * 1000).toISOString(),
      transaction_hash: tx.hash,
      block_number: blockData.height,
      transaction_type: 'bitcoin'
    }));
  }

  return data.txs.slice(0, limit).map((tx: any) => ({
    transaction_id: tx.hash,
    from_address: tx.inputs[0]?.prev_out?.addr || 'coinbase',
    to_address: tx.out[0]?.addr || 'unknown',
    amount: tx.out[0]?.value / 1e8 || 0,
    timestamp: new Date(tx.time * 1000).toISOString(),
    transaction_hash: tx.hash,
    block_number: tx.block_height,
    transaction_type: 'bitcoin'
  }));
}
