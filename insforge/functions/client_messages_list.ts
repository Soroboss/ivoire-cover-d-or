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
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })
    const body = await req.json().catch(() => ({} as any))
    const clientId = body?.clientId
    const couvaisonId = body?.couvaisonId

    let query = client.database.from('client_messages').select('*').order('sent_at', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)
    if (couvaisonId) query = query.eq('couvaison_id', couvaisonId)

    const { data, error } = await query
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const messages = (data ?? []).map((r: any) => ({
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
    }))

    return new Response(JSON.stringify({ messages }), {
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

