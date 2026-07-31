/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'
/* Partagé par les edge functions — aligné sur src/lib/permissions.ts */

export const ALL_PERMISSION_IDS = [
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

export type PermissionId = (typeof ALL_PERMISSION_IDS)[number]

export function normalizeRole(raw: string | null | undefined, isProjectAdmin?: boolean): string {
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

function defaultPermissionsForRole(role: string): PermissionId[] {
  const all = [...ALL_PERMISSION_IDS]
  if (role === 'Admin') return all
  if (role === 'Technicien') return ['couvaisons', 'clients', 'machines', 'analyses']
  if (role === 'Réception/Caisse') return ['dashboard', 'couvaisons', 'clients', 'finances', 'factures', 'historique']
  if (role === 'Finance') return ['dashboard', 'finances', 'factures', 'historique']
  if (role === 'Comptable') return ['dashboard', 'finances', 'factures', 'analyses', 'historique']
  if (role === 'Logistique') return ['couvaisons', 'clients', 'machines']
  return ['couvaisons']
}

function sanitizePermissions(arr: unknown): PermissionId[] {
  if (!Array.isArray(arr)) return []
  const valid = new Set<string>(ALL_PERMISSION_IDS)
  return arr.filter((x): x is PermissionId => typeof x === 'string' && valid.has(x))
}

export function resolvePermissions(
  role: string,
  fromProfile: string[] | undefined | null,
  isProjectAdmin?: boolean,
): PermissionId[] {
  if (isProjectAdmin || role === 'Admin') return [...ALL_PERMISSION_IDS]
  const custom = sanitizePermissions(fromProfile)
  if (custom.length > 0) return custom
  return defaultPermissionsForRole(role)
}

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

