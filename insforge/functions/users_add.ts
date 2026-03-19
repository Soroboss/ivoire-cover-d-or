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

    const nom = body?.nom
    const username = body?.username
    const telephone = body?.telephone ?? null
    const passwordHash = body?.passwordHash
    const role = body?.role
    const actif = body?.actif ?? true

    if (!nom || !username || !passwordHash || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await client.database
      .from('users')
      .insert({
        nom,
        username,
        telephone,
        password_hash: passwordHash,
        role,
        actif,
      })
      .select('id, nom, username, telephone, role, actif, password_hash')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = data?.[0]
    const user = r
      ? {
          id: r.id,
          nom: r.nom,
          username: r.username,
          telephone: r.telephone ?? undefined,
          passwordHash: r.password_hash ?? '',
          role: r.role,
          actif: r.actif,
        }
      : null

    return new Response(JSON.stringify({ user }), {
      status: user ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

