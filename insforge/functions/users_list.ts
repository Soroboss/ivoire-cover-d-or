/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// INLINED FROM lib/permissions.ts
const ALL_PERMISSION_IDS = [
  'dashboard',
  'couvaisons',
  'clients',
  'machines',
  'analyses',
  'finances',
  'factures',
  'historique',
  'administration',
] as const

function normalizeRole(raw: string | null | undefined, isProjectAdmin?: boolean): string {
  if (isProjectAdmin) return 'Admin'
  const r = (raw ?? '').trim().toLowerCase()
  if (['admin', 'administrateur', 'administrator', 'superadmin'].includes(r)) return 'Admin'
  if (['technicien', 'tech', 'technician'].includes(r)) return 'Technicien'
  if (['réception/caisse', 'reception/caisse', 'reception', 'caisse', 'réception'].includes(r)) return 'Réception/Caisse'
  return 'Technicien'
}

function resolvePermissions(
  role: string,
  fromProfile: string[] | undefined | null,
  isProjectAdmin?: boolean,
): string[] {
  if (isProjectAdmin || role === 'Admin') return [...ALL_PERMISSION_IDS]
  if (!Array.isArray(fromProfile)) {
    if (role === 'Technicien') return ['couvaisons', 'clients', 'machines', 'analyses']
    if (role === 'Réception/Caisse') return ['dashboard', 'couvaisons', 'clients', 'factures']
    return ['couvaisons']
  }
  const valid = new Set<string>(ALL_PERMISSION_IDS)
  const custom = fromProfile.filter((x): x is string => typeof x === 'string' && valid.has(x))
  if (custom.length > 0) return custom
  return ['couvaisons']
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
