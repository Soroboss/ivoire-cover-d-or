/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))
    const payload = {
      client_id: body.clientId,
      invoice_number: body.invoiceNumber,
      file_name: body.fileName,
      total_amount: Number(body.totalAmount) || 0,
      total_paid: Number(body.totalPaid) || 0,
      total_credits: Number(body.totalCredits) || 0,
      due_amount: Number(body.dueAmount) || 0,
      couvaisons_count: Number(body.couvaisonsCount) || 0,
      transactions_count: Number(body.transactionsCount) || 0,
      generated_by_user_id: body.generatedByUserId ?? null,
      generated_by_name: body.generatedByName ?? null,
      payload: body.payload ?? null,
    }
    if (!payload.client_id || !payload.invoice_number || !payload.file_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data, error } = await client.database.from('receipt_archives').insert(payload).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ success: true, id: data[0].id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

