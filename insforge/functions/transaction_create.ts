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
      couvaison_id: body.couvaisonId || null,
      client_id: body.clientId,
      montant_total: Number(body.montantTotal) || 0,
      acomptes_verses: Number(body.acomptesVerses) || 0,
      reste_a_payer: Number(body.resteAPayer) || 0,
      date_transaction: body.dateTransaction ?? new Date().toISOString(),
      type_transaction: body.typeTransaction,
      notes: body.notes ?? null,
    }

    if (!payload.client_id || !payload.type_transaction) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('transactions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r: any = existing
        const transaction = {
          id: r.id,
          couvaisonId: r.couvaison_id,
          clientId: r.client_id,
          montantTotal: Number(r.montant_total) || 0,
          acomptes_verses: Number(r.acomptes_verses) || 0,
          reste_a_payer: Number(r.reste_a_payer) || 0,
          dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
          typeTransaction: r.type_transaction,
          notes: r.notes ?? undefined,
        }
        return new Response(JSON.stringify({ transaction }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { data, error } = await client.database.from('transactions').insert({ ...payload, idempotency_key: idempotencyKey }).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r: any = data[0]
    const transaction = {
      id: r.id,
      couvaisonId: r.couvaison_id,
      clientId: r.client_id,
      montantTotal: Number(r.montant_total) || 0,
      acomptesVerses: Number(r.acomptes_verses) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
      typeTransaction: r.type_transaction,
      notes: r.notes ?? undefined,
    }
    return new Response(JSON.stringify({ transaction }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

