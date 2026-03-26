/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'
import { normalizeRole, resolvePermissions } from '../lib/permissions.ts'

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
    const apiKey = Deno.env.get('API_KEY') || anonKey // Use service role if available
    const client = createClient({ baseUrl, anonKey: apiKey })
    
    const body = await req.json().catch(() => ({} as any))
    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing user id in request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const updateValues: any = {}
    if (updates.nom !== undefined) updateValues.nom = updates.nom
    if (updates.username !== undefined) updateValues.username = updates.username
    if (updates.telephone !== undefined) updateValues.telephone = updates.telephone
    if (updates.passwordHash !== undefined) updateValues.password_hash = updates.passwordHash
    if (updates.role !== undefined) updateValues.role = updates.role
    if (updates.actif !== undefined) updateValues.actif = updates.actif

    if (updates.permissions !== undefined && Array.isArray(updates.permissions)) {
      const { data: curRow, error: curErr } = await client.database
        .from('users')
        .select('profile')
        .eq('id', id)
        .maybeSingle()
      if (curErr) {
        return new Response(JSON.stringify({ error: curErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const prev = (curRow as any)?.profile ?? {}
      updateValues.profile = { ...prev, permissions: updates.permissions }
    }

    const { data, error } = await client.database
      .from('users')
      .update(updateValues)
      .eq('id', id)
      .select('id, nom, username, telephone, role, actif, password_hash, profile, is_project_admin')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = data?.[0] as any
    const user = r
      ? (() => {
          const isProjectAdmin = Boolean(r.is_project_admin)
          const profile = r.profile ?? {}
          const fromProfile = Array.isArray(profile.permissions) ? profile.permissions : undefined
          const role = normalizeRole(r.role, isProjectAdmin)
          const permissions = resolvePermissions(role, fromProfile, isProjectAdmin)
          return {
            id: r.id,
            nom: r.nom,
            username: r.username,
            telephone: r.telephone ?? undefined,
            passwordHash: r.password_hash ?? '',
            role,
            actif: r.actif,
            isProjectAdmin,
            permissions,
          }
        })()
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

