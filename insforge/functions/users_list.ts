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

    const { data, error } = await client.database
      .from('users')
      .select('id, nom, username, telephone, role, actif, password_hash, profile, is_project_admin')
      .order('created_at', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Match app interface: {id, nom, username, passwordHash, role, actif}
    const users = (data ?? []).map((r: any) => {
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
    })

    return new Response(JSON.stringify({ users }), {
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

