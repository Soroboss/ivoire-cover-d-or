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
  if (['finance', 'financier', 'finances'].includes(r)) return 'Finance'
  if (['comptable', 'compta', 'accounting', 'accountant'].includes(r)) return 'Comptable'
  if (['logistique', 'logistic', 'logistics', 'magasinier'].includes(r)) return 'Logistique'
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
    if (role === 'Finance') return ['dashboard', 'finances', 'factures', 'historique']
    if (role === 'Comptable') return ['dashboard', 'finances', 'factures', 'analyses', 'historique']
    if (role === 'Logistique') return ['couvaisons', 'clients', 'machines']
    return ['couvaisons']
  }
  const valid = new Set<string>(ALL_PERMISSION_IDS)
  const custom = fromProfile.filter((x): x is string => typeof x === 'string' && valid.has(x))
  if (custom.length > 0) return custom
  return ['couvaisons']
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
    const permissions = body?.permissions

    if (!nom || !username || !passwordHash || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const profile = Array.isArray(permissions) && permissions.length > 0 ? { permissions } : undefined

    const { data, error } = await client.database
      .from('users')
      .insert({
        nom,
        username,
        telephone,
        password_hash: passwordHash,
        role,
        actif,
        ...(profile ? { profile } : {}),
      })
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
          const prof = r.profile ?? {}
          const fromProfile = Array.isArray(prof.permissions) ? prof.permissions : undefined
          const roleNorm = normalizeRole(r.role, isProjectAdmin)
          const perms = resolvePermissions(roleNorm, fromProfile, isProjectAdmin)
          return {
            id: r.id,
            nom: r.nom,
            username: r.username,
            telephone: r.telephone ?? undefined,
            passwordHash: r.password_hash ?? '',
            role: roleNorm,
            actif: r.actif,
            isProjectAdmin,
            permissions: perms,
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
