/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'
import { normalizeRole, resolvePermissions } from '../lib/permissions.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const body = await req.json().catch(() => ({} as any))

    const username = body?.username
    const password = body?.password

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Missing username or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = createClient({ baseUrl, anonKey })

    const { data: byUsername, error: errUsername } = await client.database
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .eq('actif', true)
      .maybeSingle()

    const { data: byPhone, error: errPhone } = await client.database
      .from('users')
      .select('*')
      .eq('telephone', username)
      .eq('password_hash', password)
      .eq('actif', true)
      .maybeSingle()

    const error = errUsername || errPhone
    const data = byUsername || byPhone

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const row = data as any
    const isProjectAdmin = Boolean(row.is_project_admin)
    const profile = row.profile ?? {}
    const fromProfile = Array.isArray(profile.permissions) ? profile.permissions : undefined
    const role = normalizeRole(row.role, isProjectAdmin)
    const permissions = resolvePermissions(role, fromProfile, isProjectAdmin)

    const user = {
      id: row.id,
      nom: row.nom,
      username: row.username,
      telephone: row.telephone ?? undefined,
      passwordHash: row.password_hash ?? '',
      role,
      actif: row.actif,
      isProjectAdmin,
      permissions,
    }

    return new Response(JSON.stringify({ user }), {
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

