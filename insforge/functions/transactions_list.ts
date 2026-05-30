/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('transactions').select('*').order('date_transaction', { ascending: false }).range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const transactions = (data ?? []).map((r: any) => ({
      id: r.id,
      couvaisonId: r.couvaison_id,
      clientId: r.client_id,
      montantTotal: Number(r.montant_total) || 0,
      acomptesVerses: Number(r.acomptes_verses) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
      typeTransaction: r.type_transaction,
      notes: r.notes ?? undefined,
    }))
    return new Response(JSON.stringify({ transactions }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

