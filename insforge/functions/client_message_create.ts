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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })
    const body = await req.json().catch(() => ({} as any))

    if (!body?.clientId || !body?.message) {
      return new Response(JSON.stringify({ error: 'Missing clientId or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = {
      client_id: body.clientId,
      couvaison_id: body.couvaisonId ?? null,
      canal: body.canal ?? 'WhatsApp',
      statut: body.statut ?? 'Envoye',
      template: body.template ?? null,
      message: body.message,
      sent_by_user_id: body.sentByUserId ?? null,
      sent_by_name: body.sentByName ?? null,
      sent_at: body.sentAt ?? new Date().toISOString(),
    }

    // Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('client_messages')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r: any = existing
        const message = {
          id: r.id,
          clientId: r.client_id,
          couvaisonId: r.couvaison_id ?? undefined,
          canal: r.canal,
          statut: r.statut,
          template: r.template ?? undefined,
          message: r.message,
          sentByUserId: r.sent_by_user_id ?? undefined,
          sentByName: r.sent_by_name ?? undefined,
          sentAt: r.sent_at ? new Date(r.sent_at).toISOString() : new Date().toISOString(),
        }
        return new Response(JSON.stringify({ message }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const { data, error } = await client.database.from('client_messages').insert({ ...payload, idempotency_key: idempotencyKey }).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r: any = data[0]
    const message = {
      id: r.id,
      clientId: r.client_id,
      couvaisonId: r.couvaison_id ?? undefined,
      canal: r.canal,
      statut: r.statut,
      template: r.template ?? undefined,
      message: r.message,
      sentByUserId: r.sent_by_user_id ?? undefined,
      sentByName: r.sent_by_name ?? undefined,
      sentAt: r.sent_at ? new Date(r.sent_at).toISOString() : new Date().toISOString(),
    }

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

