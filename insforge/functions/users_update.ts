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
    if (role === 'Réception/Caisse') return ['dashboard', 'couvaisons', 'clients', 'finances', 'factures', 'historique']
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
    const apiKey = Deno.env.get('API_KEY')
    
    console.log(`[users_update] Updating user. HasApiKey: ${!!apiKey}`)
    const client = createClient({ baseUrl, anonKey: apiKey || anonKey })
    
    const body = await req.json().catch(() => ({} as any))
    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
       console.error('[users_update] Missing ID')
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

    // Handle profile update for permissions
    if (updates.permissions !== undefined && Array.isArray(updates.permissions)) {
      console.log(`[users_update] Requested permissions: ${updates.permissions.join(',')}`)
      const { data: curRow, error: curErr } = await client.database
        .from('users')
        .select('profile')
        .eq('id', id)
        .maybeSingle()
      
      if (curErr) {
        console.error('[users_update] Error fetching profile:', curErr)
        return new Response(JSON.stringify({ error: curErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const prev = (curRow as any)?.profile ?? {}
      updateValues.profile = { ...prev, permissions: updates.permissions }
    }

    console.log(`[users_update] Final updateValues:`, JSON.stringify(updateValues))
    const { data: updateData, error: updateError } = await client.database
      .from('users')
      .update(updateValues)
      .eq('id', id)
      .select('id, nom, username, telephone, role, actif, password_hash, profile, is_project_admin')

    if (updateError) {
      console.error('[users_update] DB Update error:', updateError)
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = updateData?.[0] as any
    if (!r) {
       console.warn('[users_update] No user found to update with ID:', id)
    }
    
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
    console.error('[users_update] Unexpected error:', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
