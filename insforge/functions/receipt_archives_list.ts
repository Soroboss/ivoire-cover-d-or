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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
      const res = await client.database.from('receipt_archives').select('*').order('created_at', { ascending: false }).range(from, from + step - 1);
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
    const archives = (data ?? []).map((r: any) => ({
      id: r.id,
      clientId: r.client_id,
      invoiceNumber: r.invoice_number,
      fileName: r.file_name,
      totalAmount: Number(r.total_amount) || 0,
      totalPaid: Number(r.total_paid) || 0,
      totalCredits: Number(r.total_credits) || 0,
      dueAmount: Number(r.due_amount) || 0,
      couvaisonsCount: Number(r.couvaisons_count) || 0,
      transactionsCount: Number(r.transactions_count) || 0,
      generatedByUserId: r.generated_by_user_id ?? undefined,
      generatedByName: r.generated_by_name ?? undefined,
      payload: r.payload ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }))
    return new Response(JSON.stringify({ archives }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

