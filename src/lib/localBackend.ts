/* eslint-disable */
// @ts-nocheck
// AUTO-GENERATED - DO NOT EDIT
import { createClient } from '@supabase/supabase-js';

const Deno = {
  env: {
    get: (key) => {
      if (key === 'INSFORGE_BASE_URL') return import.meta.env.VITE_INSFORGE_OSS_HOST || 'https://bzna2rx5.eu-central.insforge.app';
      if (key === 'ANON_KEY') return 'ik_bde2c73e789f5234a01bd842ad7bb3fa';
      return '';
    }
  }
};

export const localEdgeFunctions: Record<string, (req: Request) => Promise<Response>> = {};


// -----------------------------------------------------
// Function: users_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


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

localEdgeFunctions["users_update"] = async function(req: Request) {
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
    
    // Important: utiliser anonKey uniquement (comme users_list) pour cibler public.users
    const client = createClient({ baseUrl, anonKey })
    
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

    console.log(`[users_update] Updating user: userId=${id}`, JSON.stringify(updateValues))
    
    const { data: updateData, error: updateError } = await client.database
      .from('users')
      .update(updateValues)
      .eq('id', id)
      .select('id, nom, username, telephone, role, actif, password_hash')

    if (updateError) {
      console.error('[users_update] DB Update error:', updateError)
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = updateData?.[0] as any
    if (!r) {
       console.warn('[users_update] No user returned after update for ID:', id)
    }

    const user = r
      ? (() => {
          const isProjectAdmin = false // Non supporté sur public.users directement
          const role = normalizeRole(r.role, isProjectAdmin)
          const permissions = resolvePermissions(role, undefined, isProjectAdmin)
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
      status: 200, // Toujours 200 si l'update a réussi (même si le select est vide)
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

})();

// -----------------------------------------------------
// Function: users_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


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

localEdgeFunctions["users_list"] = async function(req: Request) {
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

    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('users').select('id, nom, username, telephone, role, actif, password_hash, profile, is_project_admin').order('created_at', { ascending: true }).range(from, from + step - 1);
      if (res.error) { error = res.error; break; }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


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

})();

// -----------------------------------------------------
// Function: users_add
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


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

localEdgeFunctions["users_add"] = async function(req: Request) {
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

})();

// -----------------------------------------------------
// Function: transactions_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["transactions_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('transactions').select('*').order('date_transaction', { ascending: false }).range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const transactions = (data ?? []).map((r: any) => ({
      id: r.id,
      couvaisonId: r.couvaison_id,
      clientId: r.client_id,
      montantTotal: Number(r.montant_total) || 0,
      acomptesVerses: Number(r.acomptes_verses) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
      typeTransaction: r.type_transaction,
      notes: r.notes ?? undefined,
    }))
    return new Response(JSON.stringify({ transactions }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: transaction_insert
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["transaction_insert"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const text = await req.text().catch(() => '');
    console.log('RAW TEXT:', text);
    const body = text ? JSON.parse(text) : {};
    console.log('PARSED BODY:', body);
    const payload = {
      couvaison_id: body.couvaisonId || null,
      client_id: body.clientId,
      montant_total: Number(body.montantTotal) || 0,
      acomptes_verses: Number(body.acomptesVerses) || 0,
      reste_a_payer: Number(body.resteAPayer) || 0,
      date_transaction: body.dateTransaction ?? new Date().toISOString(),
      type_transaction: body.typeTransaction,
      notes: body.notes ?? null,
    }

    if (!payload.client_id || !payload.type_transaction) {
      return new Response(JSON.stringify({ error: 'Missing required fields', payload, body }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('transactions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r: any = existing
        const transaction = {
          id: r.id,
          couvaisonId: r.couvaison_id,
          clientId: r.client_id,
          montantTotal: Number(r.montant_total) || 0,
          acomptes_verses: Number(r.acomptes_verses) || 0,
          reste_a_payer: Number(r.reste_a_payer) || 0,
          dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
          typeTransaction: r.type_transaction,
          notes: r.notes ?? undefined,
        }
        return new Response(JSON.stringify({ transaction }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { data, error } = await client.database.from('transactions').insert({ ...payload, idempotency_key: idempotencyKey }).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r: any = data[0]
    const transaction = {
      id: r.id,
      couvaisonId: r.couvaison_id,
      clientId: r.client_id,
      montantTotal: Number(r.montant_total) || 0,
      acomptesVerses: Number(r.acomptes_verses) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
      typeTransaction: r.type_transaction,
      notes: r.notes ?? undefined,
    }
    return new Response(JSON.stringify({ transaction }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: transaction_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["transaction_create"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const text = await req.text().catch(() => '');
    console.log('RAW TEXT:', text);
    const body = text ? JSON.parse(text) : {};
    console.log('PARSED BODY:', body);
    const payload = {
      couvaison_id: body.couvaisonId || null,
      client_id: body.clientId,
      montant_total: Number(body.montantTotal) || 0,
      acomptes_verses: Number(body.acomptesVerses) || 0,
      reste_a_payer: Number(body.resteAPayer) || 0,
      date_transaction: body.dateTransaction ?? new Date().toISOString(),
      type_transaction: body.typeTransaction,
      notes: body.notes ?? null,
    }

    if (!payload.client_id || !payload.type_transaction) {
      return new Response(JSON.stringify({ error: 'Missing required fields', payload, body }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('transactions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r: any = existing
        const transaction = {
          id: r.id,
          couvaisonId: r.couvaison_id,
          clientId: r.client_id,
          montantTotal: Number(r.montant_total) || 0,
          acomptes_verses: Number(r.acomptes_verses) || 0,
          reste_a_payer: Number(r.reste_a_payer) || 0,
          dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
          typeTransaction: r.type_transaction,
          notes: r.notes ?? undefined,
        }
        return new Response(JSON.stringify({ transaction }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { data, error } = await client.database.from('transactions').insert({ ...payload, idempotency_key: idempotencyKey }).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r: any = data[0]
    const transaction = {
      id: r.id,
      couvaisonId: r.couvaison_id,
      clientId: r.client_id,
      montantTotal: Number(r.montant_total) || 0,
      acomptesVerses: Number(r.acomptes_verses) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      dateTransaction: r.date_transaction ? new Date(r.date_transaction).toISOString() : new Date().toISOString(),
      typeTransaction: r.type_transaction,
      notes: r.notes ?? undefined,
    }
    return new Response(JSON.stringify({ transaction }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: test_func
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */

/* Partagé par les edge functions — aligné sur src/lib/permissions.ts */

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

type PermissionId = (typeof ALL_PERMISSION_IDS)[number]

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

function resolvePermissions(
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

localEdgeFunctions["test_func"] = async function(req: Request) {
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


})();

// -----------------------------------------------------
// Function: test
// -----------------------------------------------------
(function() {


localEdgeFunctions["test"] = async function(req: Request) {
  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
  const anonKey = Deno.env.get('ANON_KEY') || ''
  const client = createClient({ baseUrl, anonKey })
  
  return new Response(JSON.stringify({ ok: true, hasClient: !!client }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

})();

// -----------------------------------------------------
// Function: salaire_agents_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["salaire_agents_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('salaire_agents').select('*').order('nom', { ascending: true }).range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const agents = (data ?? []).map((r: any) => ({
      id: r.id,
      nom: r.nom,
      fonction: r.fonction ?? undefined,
      matricule: r.matricule ?? undefined,
      numeroCnps: r.numero_cnps ?? undefined,
      salaireMensuelBrut: Number(r.salaire_mensuel_brut) || 0,
      primesDefaut: Number(r.primes_defaut) || 0,
      autresGainsDefaut: Number(r.autres_gains_defaut) || 0,
      retenuesDiversesDefaut: Number(r.retenues_diverses_defaut) || 0,
      reductionChargesFamilleDefaut: Number(r.reduction_ricf_defaut) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }))
    return new Response(JSON.stringify({ agents }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

})();

// -----------------------------------------------------
// Function: salaire_agent_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["salaire_agent_update"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))
    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const updateValues: any = {}
    if (updates.nom !== undefined) updateValues.nom = String(updates.nom).trim()
    if (updates.fonction !== undefined) updateValues.fonction = updates.fonction ?? null
    if (updates.matricule !== undefined) updateValues.matricule = updates.matricule ?? null
    if (updates.numeroCnps !== undefined) updateValues.numero_cnps = updates.numeroCnps ?? null
    if (updates.salaireMensuelBrut !== undefined) {
      const s = Number(updates.salaireMensuelBrut)
      if (Number.isNaN(s) || s < 0) {
        return new Response(JSON.stringify({ error: 'Salaire invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      updateValues.salaire_mensuel_brut = s
    }
    if (updates.primesDefaut !== undefined) updateValues.primes_defaut = Math.max(0, Number(updates.primesDefaut) || 0)
    if (updates.autresGainsDefaut !== undefined) updateValues.autres_gains_defaut = Math.max(0, Number(updates.autresGainsDefaut) || 0)
    if (updates.retenuesDiversesDefaut !== undefined)
      updateValues.retenues_diverses_defaut = Math.max(0, Number(updates.retenuesDiversesDefaut) || 0)
    if (updates.reductionChargesFamilleDefaut !== undefined)
      updateValues.reduction_ricf_defaut = Math.max(0, Number(updates.reductionChargesFamilleDefaut) || 0)
    if (updates.notes !== undefined) updateValues.notes = updates.notes ?? null

    if (Object.keys(updateValues).length === 0) {
      return new Response(JSON.stringify({ error: 'Aucune mise à jour' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: updated, error } = await client.database.from('salaire_agents').update(updateValues).eq('id', id).select('*')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r = updated?.[0]
    if (!r) {
      return new Response(JSON.stringify({ error: 'Salarié introuvable' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const agent = {
      id: r.id,
      nom: r.nom,
      fonction: r.fonction ?? undefined,
      matricule: r.matricule ?? undefined,
      numeroCnps: r.numero_cnps ?? undefined,
      salaireMensuelBrut: Number(r.salaire_mensuel_brut) || 0,
      primesDefaut: Number(r.primes_defaut) || 0,
      autresGainsDefaut: Number(r.autres_gains_defaut) || 0,
      retenuesDiversesDefaut: Number(r.retenues_diverses_defaut) || 0,
      reductionChargesFamilleDefaut: Number(r.reduction_ricf_defaut) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }
    return new Response(JSON.stringify({ agent }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

})();

// -----------------------------------------------------
// Function: salaire_agent_delete
// -----------------------------------------------------
(function() {


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["salaire_agent_delete"] = async function(req: Request) {
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
    const body = (await req.json().catch(() => ({} as { id?: string }))) as { id?: string }

    const id = body?.id
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await client.database.from('salaire_agents').delete().eq('id', id)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id }), {
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

})();

// -----------------------------------------------------
// Function: salaire_agent_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["salaire_agent_create"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))

    const nom = String(body.nom || '').trim()
    if (!nom) {
      return new Response(JSON.stringify({ error: 'Nom requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const salaireMensuelBrut = Number(body.salaireMensuelBrut)
    if (Number.isNaN(salaireMensuelBrut) || salaireMensuelBrut < 0) {
      return new Response(JSON.stringify({ error: 'Salaire mensuel invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const payload = {
      nom,
      fonction: body.fonction != null ? String(body.fonction) : null,
      matricule: body.matricule != null ? String(body.matricule) : null,
      numero_cnps: body.numeroCnps != null ? String(body.numeroCnps) : null,
      salaire_mensuel_brut: salaireMensuelBrut,
      primes_defaut: Math.max(0, Number(body.primesDefaut) || 0),
      autres_gains_defaut: Math.max(0, Number(body.autresGainsDefaut) || 0),
      retenues_diverses_defaut: Math.max(0, Number(body.retenuesDiversesDefaut) || 0),
      reduction_ricf_defaut: Math.max(0, Number(body.reductionChargesFamilleDefaut) || 0),
      notes: body.notes != null ? String(body.notes) : null,
    }

    // Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('salaire_agents')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r: any = existing
        const agent = {
          id: r.id,
          nom: r.nom,
          fonction: r.fonction ?? undefined,
          matricule: r.matricule ?? undefined,
          numeroCnps: r.numero_cnps ?? undefined,
          salaireMensuelBrut: Number(r.salaire_mensuel_brut) || 0,
          primesDefaut: Number(r.primes_defaut) || 0,
          autresGainsDefaut: Number(r.autres_gains_defaut) || 0,
          retenuesDiversesDefaut: Number(r.retenues_diverses_defaut) || 0,
          reductionChargesFamilleDefaut: Number(r.reduction_ricf_defaut) || 0,
          notes: r.notes ?? undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }
        return new Response(JSON.stringify({ agent }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { data, error } = await client.database.from('salaire_agents').insert({ ...payload, idempotency_key: idempotencyKey }).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r: any = data[0]
    const agent = {
      id: r.id,
      nom: r.nom,
      fonction: r.fonction ?? undefined,
      matricule: r.matricule ?? undefined,
      numeroCnps: r.numero_cnps ?? undefined,
      salaireMensuelBrut: Number(r.salaire_mensuel_brut) || 0,
      primesDefaut: Number(r.primes_defaut) || 0,
      autresGainsDefaut: Number(r.autres_gains_defaut) || 0,
      retenuesDiversesDefaut: Number(r.retenues_diverses_defaut) || 0,
      reductionChargesFamilleDefaut: Number(r.reduction_ricf_defaut) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }
    return new Response(JSON.stringify({ agent }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

})();

// -----------------------------------------------------
// Function: receipt_archives_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["receipt_archives_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('receipt_archives').select('*').order('created_at', { ascending: false }).range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const archives = (data ?? []).map((r: any) => ({
      id: r.id,
      clientId: r.client_id,
      invoiceNumber: r.invoice_number,
      fileName: r.file_name,
      totalAmount: Number(r.total_amount) || 0,
      totalPaid: Number(r.total_paid) || 0,
      totalCredits: Number(r.total_credits) || 0,
      dueAmount: Number(r.due_amount) || 0,
      couvaisonsCount: Number(r.couvaisons_count) || 0,
      transactionsCount: Number(r.transactions_count) || 0,
      generatedByUserId: r.generated_by_user_id ?? undefined,
      generatedByName: r.generated_by_name ?? undefined,
      payload: r.payload ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }))
    return new Response(JSON.stringify({ archives }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: receipt_archive_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["receipt_archive_create"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))
    const payload = {
      client_id: body.clientId,
      invoice_number: body.invoiceNumber,
      file_name: body.fileName,
      total_amount: Number(body.totalAmount) || 0,
      total_paid: Number(body.totalPaid) || 0,
      total_credits: Number(body.totalCredits) || 0,
      due_amount: Number(body.dueAmount) || 0,
      couvaisons_count: Number(body.couvaisonsCount) || 0,
      transactions_count: Number(body.transactionsCount) || 0,
      generated_by_user_id: body.generatedByUserId ?? null,
      generated_by_name: body.generatedByName ?? null,
      payload: body.payload ?? null,
    }
    if (!payload.client_id || !payload.invoice_number || !payload.file_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data, error } = await client.database.from('receipt_archives').insert(payload).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ success: true, id: data[0].id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: message_templates_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["message_templates_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  
  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })

    
    let templates: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('message_templates').select('*').order('created_at', { ascending: false }).range(from, from + step - 1);
      if (res.error) { error = res.error; break; }
      if (res.data) templates = templates.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formattedTemplates = (templates ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      content: t.content,
      category: t.category,
      isActive: t.is_active,
      updatedAt: t.updated_at,
      createdAt: t.created_at
    }))

    return new Response(JSON.stringify({ templates: formattedTemplates }), {
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

})();

// -----------------------------------------------------
// Function: message_template_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["message_template_update"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })

    const body = await req.json()
    const { id } = body
    const updates = body.updates || {}

    if (!id) throw new Error('Template ID is required')

    const dbUpdates: any = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.content) dbUpdates.content = updates.content
    if (updates.category) dbUpdates.category = updates.category
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await client.database
      .from('message_templates')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ template: data }), {
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

})();

// -----------------------------------------------------
// Function: message_template_delete
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["message_template_delete"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })

    const body = await req.json()
    const { id } = body

    if (!id) throw new Error('Template ID is required')

    const { error } = await client.database
      .from('message_templates')
      .delete()
      .eq('id', id)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
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

})();

// -----------------------------------------------------
// Function: message_template_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["message_template_create"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })

    const body = await req.json()
    const { name, content, category, isActive } = body

    const { data, error } = await client.database
      .from('message_templates')
      .insert({
        name,
        content,
        category,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ template: data }), {
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

})();

// -----------------------------------------------------
// Function: machines_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["machines_list"] = async function(req: Request) {
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

    
    let machinesRows: any[] = [];
    let machinesErr: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('machines').select('*').order('created_at', { ascending: true }).range(from, from + step - 1);
      if (res.error) { machinesErr = res.error; break; }
      if (res.data) machinesRows = machinesRows.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


    if (machinesErr) {
      return new Response(JSON.stringify({ error: machinesErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const machineIds = (machinesRows ?? []).map((m: any) => m.id)
    
    let casiersRows: any[] = [];
    let casiersErr: any = null;
    if (machineIds.length) {
      let from2 = 0;
      while(true) {
         const res = await client.database.from('casiers').select('*').in('machine_id', machineIds).range(from2, from2 + step - 1);
         if (res.error) { casiersErr = res.error; break; }
         if (res.data) casiersRows = casiersRows.concat(res.data);
         if (!res.data || res.data.length < step) break;
         from2 += step;
      }
    }


    if (casiersErr) {
      return new Response(JSON.stringify({ error: casiersErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const machines = (machinesRows ?? []).map((m: any) => ({
      id: m.id,
      nom: m.nom,
      capacite: Number(m.capacite) || 0,
      type: m.type,
      enService: !!m.en_service,
      casiers: (casiersRows ?? [])
        .filter((c: any) => c.machine_id === m.id)
        .map((c: any) => ({ id: c.id, nom: c.nom, capacite: Number(c.capacite) || 0 })),
    }))

    return new Response(JSON.stringify({ machines }), {
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


})();

// -----------------------------------------------------
// Function: machine_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["machine_update"] = async function(req: Request) {
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

    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const updateValues: any = {}
    if (updates.nom !== undefined) updateValues.nom = updates.nom
    if (updates.type !== undefined) updateValues.type = updates.type
    if (updates.enService !== undefined) updateValues.en_service = updates.enService
    if (updates.capacite !== undefined) updateValues.capacite = Number(updates.capacite) || 0

    const { error: machineErr } = await client.database.from('machines').update(updateValues).eq('id', id)
    if (machineErr) {
      return new Response(JSON.stringify({ error: machineErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (updates.casiers !== undefined && Array.isArray(updates.casiers)) {
      const { error: delErr } = await client.database.from('casiers').delete().eq('machine_id', id)
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (updates.casiers.length > 0) {
        const casiersPayload = updates.casiers.map((c: any) => ({
          machine_id: id,
          nom: c.nom,
          capacite: Number(c.capacite) || 0,
        }))
        const { error: insErr } = await client.database.from('casiers').insert(casiersPayload)
        if (insErr) {
          return new Response(JSON.stringify({ error: insErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, id }), {
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


})();

// -----------------------------------------------------
// Function: machine_delete
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["machine_delete"] = async function(req: Request) {
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

    const id = body?.id
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await client.database.from('machines').delete().eq('id', id)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id }), {
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


})();

// -----------------------------------------------------
// Function: machine_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["machine_create"] = async function(req: Request) {
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
    const type = body?.type
    const enService = body?.enService ?? true
    const casiers = Array.isArray(body?.casiers) ? body.casiers : []
    const capacite = Number(body?.capacite ?? casiers.reduce((s: number, c: any) => s + (Number(c.capacite) || 0), 0))

    if (!nom || !type) {
      return new Response(JSON.stringify({ error: 'Missing machine data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: insertedMachine, error: machineErr } = await client.database
      .from('machines')
      .insert({ nom, type, en_service: enService, capacite })
      .select('*')

    if (machineErr || !insertedMachine?.[0]) {
      return new Response(JSON.stringify({ error: machineErr?.message || 'Machine insert failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const machineId = insertedMachine[0].id
    if (casiers.length > 0) {
      const casiersPayload = casiers.map((c: any) => ({
        machine_id: machineId,
        nom: c.nom,
        capacite: Number(c.capacite) || 0,
      }))
      const { error: casiersErr } = await client.database.from('casiers').insert(casiersPayload)
      if (casiersErr) {
        return new Response(JSON.stringify({ error: casiersErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ success: true, id: machineId }), {
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


})();

// -----------------------------------------------------
// Function: logs_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["logs_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const { data, error } = await client.database.from('logs').select('*').order('timestamp', { ascending: false }).limit(1000)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const logs = (data ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id ?? '',
      userName: r.user_name,
      action: r.action,
      target: r.target,
      details: r.details,
      timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
    }))
    return new Response(JSON.stringify({ logs }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: login
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */

/* Partagé par les edge functions — aligné sur src/lib/permissions.ts */

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

type PermissionId = (typeof ALL_PERMISSION_IDS)[number]

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

function resolvePermissions(
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

localEdgeFunctions["login"] = async function(req: Request) {
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


})();

// -----------------------------------------------------
// Function: log_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["log_create"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))
    const payload = {
      user_id: body.userId ?? null,
      user_name: body.userName ?? 'Système',
      action: body.action ?? 'SYSTÈME',
      target: body.target ?? 'Système',
      details: body.details ?? '',
      timestamp: body.timestamp ?? new Date().toISOString(),
    }
    const { data, error } = await client.database.from('logs').insert(payload).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ success: true, id: data[0].id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}


})();

// -----------------------------------------------------
// Function: depenses_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["depenses_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('depenses').select('*').order('date_depense', { ascending: false }).range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const depenses = (data ?? []).map((r: any) => ({
      id: r.id,
      dateDepense: r.date_depense ? new Date(r.date_depense).toISOString() : new Date().toISOString(),
      categorie: r.categorie,
      libelle: r.libelle,
      montant: Number(r.montant) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }))
    return new Response(JSON.stringify({ depenses }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

})();

// -----------------------------------------------------
// Function: depense_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["depense_update"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))
    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const updateValues: any = {}
    if (updates.dateDepense !== undefined) updateValues.date_depense = updates.dateDepense
    if (updates.categorie !== undefined) updateValues.categorie = updates.categorie
    if (updates.libelle !== undefined) updateValues.libelle = updates.libelle
    if (updates.montant !== undefined) {
      const m = Number(updates.montant)
      if (m < 0 || Number.isNaN(m)) {
        return new Response(JSON.stringify({ error: 'Montant invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      updateValues.montant = m
    }
    if (updates.notes !== undefined) updateValues.notes = updates.notes ?? null

    if (Object.keys(updateValues).length === 0) {
      return new Response(JSON.stringify({ error: 'Aucune mise à jour' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: updated, error } = await client.database.from('depenses').update(updateValues).eq('id', id).select('*')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r = updated?.[0]
    if (!r) {
      return new Response(JSON.stringify({ error: 'Dépense introuvable' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const depense = {
      id: r.id,
      dateDepense: r.date_depense ? new Date(r.date_depense).toISOString() : new Date().toISOString(),
      categorie: r.categorie,
      libelle: r.libelle,
      montant: Number(r.montant) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }
    return new Response(JSON.stringify({ depense }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

})();

// -----------------------------------------------------
// Function: depense_delete
// -----------------------------------------------------
(function() {


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["depense_delete"] = async function(req: Request) {
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
    const body = (await req.json().catch(() => ({} as { id?: string }))) as { id?: string }

    const id = body?.id
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await client.database.from('depenses').delete().eq('id', id)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id }), {
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

})();

// -----------------------------------------------------
// Function: depense_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["depense_create"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))

    const montant = Number(body.montant) ?? 0
    if (montant < 0 || Number.isNaN(montant)) {
      return new Response(JSON.stringify({ error: 'Montant invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const payload = {
      date_depense: body.dateDepense ?? new Date().toISOString(),
      categorie: String(body.categorie || '').trim() || 'Autre',
      libelle: String(body.libelle || '').trim(),
      montant,
      notes: body.notes != null ? String(body.notes) : null,
    }

    if (!payload.libelle) {
      return new Response(JSON.stringify({ error: 'Libellé requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('depenses')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r: any = existing
        const depense = {
          id: r.id,
          dateDepense: r.date_depense ? new Date(r.date_depense).toISOString() : new Date().toISOString(),
          categorie: r.categorie,
          libelle: r.libelle,
          montant: Number(r.montant) || 0,
          notes: r.notes ?? undefined,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }
        return new Response(JSON.stringify({ depense }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { data, error } = await client.database.from('depenses').insert({ ...payload, idempotency_key: idempotencyKey }).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r: any = data[0]
    const depense = {
      id: r.id,
      dateDepense: r.date_depense ? new Date(r.date_depense).toISOString() : new Date().toISOString(),
      categorie: r.categorie,
      libelle: r.libelle,
      montant: Number(r.montant) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }
    return new Response(JSON.stringify({ depense }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

})();

// -----------------------------------------------------
// Function: couvaisons_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["couvaisons_list"] = async function(req: Request) {
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

    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('couvaisons').select('*').range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const couvaisons = (data ?? []).map((r: any) => ({
      id: r.id,
      clientId: r.client_id,
      typeOeuf: r.type_oeuf,
      nombreOeufs: r.nombre_oeufs,
      prixUnitaire: r.prix_unitaire,
      dateReception: r.date_reception ? new Date(r.date_reception).toISOString() : r.date_reception,
      dateMiseEnMachine: r.date_mise_en_machine ? new Date(r.date_mise_en_machine).toISOString() : undefined,
      dateMiragePrevue: r.date_mirage_prevue ? new Date(r.date_mirage_prevue).toISOString() : undefined,
      dateEclosionPrevue: r.date_eclosion_prevue ? new Date(r.date_eclosion_prevue).toISOString() : undefined,
      dateEclosionDemarrage: r.date_eclosion_demarrage ? new Date(r.date_eclosion_demarrage).toISOString() : undefined,
      nomDepart: r.nom_depart ?? undefined,
      statut: r.statut,
      oeufsClairs: r.oeufs_clairs ?? undefined,
      oeufsPourris: r.oeufs_pourris ?? undefined,
      poussinsNes: r.poussins_nes ?? undefined,
      mortsEnCoque: r.morts_en_coque ?? undefined,
      emplacements: r.emplacements ?? undefined,
      emplacementsAvantMirage: r.emplacements_avant_mirage ?? undefined,
      emplacementsApresMirage: r.emplacements_apres_mirage ?? undefined,
      causeEchecMajeure: r.cause_echec_majeure ?? undefined,
      notesEchec: r.notes_echec ?? undefined,
    }))

    return new Response(JSON.stringify({ couvaisons }), {
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


})();

// -----------------------------------------------------
// Function: couvaison_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["couvaison_update"] = async function(req: Request) {
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

    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const updateValues: any = {}
    if (updates.statut !== undefined) updateValues.statut = updates.statut
    if (updates.oeufsClairs !== undefined) updateValues.oeufs_clairs = updates.oeufsClairs
    if (updates.oeufsPourris !== undefined) updateValues.oeufs_pourris = updates.oeufsPourris
    if (updates.poussinsNes !== undefined) updateValues.poussins_nes = updates.poussinsNes
    if (updates.mortsEnCoque !== undefined) updateValues.morts_en_coque = updates.mortsEnCoque
    if (updates.dateMiseEnMachine !== undefined) updateValues.date_mise_en_machine = updates.dateMiseEnMachine ?? null
    if (updates.dateMiragePrevue !== undefined) updateValues.date_mirage_prevue = updates.dateMiragePrevue ?? null
    if (updates.dateEclosionPrevue !== undefined) updateValues.date_eclosion_prevue = updates.dateEclosionPrevue ?? null
    if (updates.dateEclosionDemarrage !== undefined) updateValues.date_eclosion_demarrage = updates.dateEclosionDemarrage ?? null
    if (updates.nomDepart !== undefined) updateValues.nom_depart = updates.nomDepart ?? null
    if (updates.causeEchecMajeure !== undefined) updateValues.cause_echec_majeure = updates.causeEchecMajeure ?? null
    if (updates.notesEchec !== undefined) updateValues.notes_echec = updates.notesEchec ?? null
    if (updates.emplacements !== undefined) updateValues.emplacements = updates.emplacements ?? null
    if (updates.emplacementsAvantMirage !== undefined)
      updateValues.emplacements_avant_mirage = updates.emplacementsAvantMirage ?? null
    if (updates.emplacementsApresMirage !== undefined)
      updateValues.emplacements_apres_mirage = updates.emplacementsApresMirage ?? null

    const { data: updated, error } = await client.database
      .from('couvaisons')
      .update(updateValues)
      .eq('id', id)
      .select('*')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = updated?.[0]
    const couvaison = r
      ? {
          id: r.id,
          clientId: r.client_id,
          typeOeuf: r.type_oeuf,
          nombreOeufs: r.nombre_oeufs,
          prixUnitaire: r.prix_unitaire,
          dateReception: r.date_reception ? new Date(r.date_reception).toISOString() : r.date_reception,
          dateMiseEnMachine: r.date_mise_en_machine ? new Date(r.date_mise_en_machine).toISOString() : undefined,
          dateMiragePrevue: r.date_mirage_prevue ? new Date(r.date_mirage_prevue).toISOString() : undefined,
          dateEclosionPrevue: r.date_eclosion_prevue ? new Date(r.date_eclosion_prevue).toISOString() : undefined,
          dateEclosionDemarrage: r.date_eclosion_demarrage ? new Date(r.date_eclosion_demarrage).toISOString() : undefined,
          nomDepart: r.nom_depart ?? undefined,
          statut: r.statut,
          oeufsClairs: r.oeufs_clairs ?? undefined,
          oeufsPourris: r.oeufs_pourris ?? undefined,
          poussinsNes: r.poussins_nes ?? undefined,
          mortsEnCoque: r.morts_en_coque ?? undefined,
          emplacements: r.emplacements ?? undefined,
          emplacementsAvantMirage: r.emplacements_avant_mirage ?? undefined,
          emplacementsApresMirage: r.emplacements_apres_mirage ?? undefined,
          causeEchecMajeure: r.cause_echec_majeure ?? undefined,
          notesEchec: r.notes_echec ?? undefined,
        }
      : null

    return new Response(JSON.stringify({ couvaison }), {
      status: couvaison ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}


})();

// -----------------------------------------------------
// Function: couvaison_delete
// -----------------------------------------------------
(function() {


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["couvaison_delete"] = async function(req: Request) {
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
    const body = (await req.json().catch(() => ({} as { id?: string }))) as { id?: string }

    const id = body?.id
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await client.database.from('couvaisons').delete().eq('id', id)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id }), {
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


})();

// -----------------------------------------------------
// Function: couvaison_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["couvaison_create"] = async function(req: Request) {
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

    const couv = body?.couv
    const clientInfos = body?.clientInfos

    if (!couv || !clientInfos?.telephone) {
      return new Response(JSON.stringify({ error: 'Missing couv or clientInfos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1) Get or create client by telephone
    const { data: existingClient, error: clientErr } = await client.database
      .from('clients')
      .select('*')
      .eq('telephone', clientInfos.telephone)
      .maybeSingle()

    if (clientErr) {
      return new Response(JSON.stringify({ error: clientErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get client count for ID generation if creating new
    let clientRow: any = existingClient;
    
    if (!clientRow) {
      const { data: allClients } = await client.database
        .from('clients')
        .select('id', { count: 'exact' });
      
      const nextId = (allClients?.length || 0) + 1;
      const clientIdExt = `#ICO${nextId}`;

      const { data: created, error: createErr } = await client.database
        .from('clients')
        .insert({
          nom: clientInfos.nom,
          telephone: clientInfos.telephone,
          client_id_ext: clientIdExt
        })
        .select();
      
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      clientRow = created?.[0];
    }

    if (!clientRow?.id) {
      return new Response(JSON.stringify({ error: 'Failed to resolve client' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2) Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('couvaisons')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r = existing
        const couvaison = {
          id: r.id,
          clientId: r.client_id,
          typeOeuf: r.type_oeuf,
          nombreOeufs: r.nombre_oeufs,
          prixUnitaire: r.prix_unitaire,
          dateReception: r.date_reception ? new Date(r.date_reception).toISOString() : r.date_reception,
          dateMiseEnMachine: r.date_mise_en_machine ? new Date(r.date_mise_en_machine).toISOString() : undefined,
          dateMiragePrevue: r.date_mirage_prevue ? new Date(r.date_mirage_prevue).toISOString() : undefined,
          dateEclosionPrevue: r.date_eclosion_prevue ? new Date(r.date_eclosion_prevue).toISOString() : undefined,
          dateEclosionDemarrage: r.date_eclosion_demarrage ? new Date(r.date_eclosion_demarrage).toISOString() : undefined,
          nomDepart: r.nom_depart ?? undefined,
          statut: r.statut,
          oeufsClairs: r.oeufs_clairs ?? undefined,
          oeufsPourris: r.oeufs_pourris ?? undefined,
          poussins_nes: r.poussins_nes ?? undefined,
          mortsEnCoque: r.morts_en_coque ?? undefined,
          emplacements: r.emplacements ?? undefined,
          emplacementsAvantMirage: r.emplacements_avant_mirage ?? undefined,
          emplacementsApresMirage: r.emplacements_apres_mirage ?? undefined,
          causeEchecMajeure: r.cause_echec_majeure ?? undefined,
          notesEchec: r.notes_echec ?? undefined,
        }
        return new Response(JSON.stringify({ couvaison }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 3) Insert couvaison
    const { data: inserted, error: insertErr } = await client.database
      .from('couvaisons')
      .insert({
        client_id: clientRow.id,
        type_oeuf: couv.typeOeuf,
        nombre_oeufs: couv.nombreOeufs,
        prix_unitaire: couv.prixUnitaire,
        date_reception: couv.dateReception,
        date_mise_en_machine: couv.dateMiseEnMachine ?? null,
        date_mirage_prevue: couv.dateMiragePrevue ?? null,
        date_eclosion_prevue: couv.dateEclosionPrevue ?? null,
        date_eclosion_demarrage: couv.dateEclosionDemarrage ?? null,
        nom_depart: couv.nomDepart ?? null,
        statut: couv.statut,
        oeufs_clairs: couv.oeufsClairs ?? null,
        oeufs_pourris: couv.oeufsPourris ?? null,
        poussins_nes: couv.poussinsNes ?? null,
        morts_en_coque: couv.mortsEnCoque ?? null,
        emplacements: couv.emplacements ?? null,
        emplacements_avant_mirage: couv.emplacementsAvantMirage ?? null,
        emplacements_apres_mirage: couv.emplacementsApresMirage ?? null,
        cause_echec_majeure: couv.causeEchecMajeure ?? null,
        notes_echec: couv.notesEchec ?? null,
        idempotency_key: idempotencyKey,
      })
      .select('*')

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = inserted?.[0]
    const couvaison = r
      ? {
          id: r.id,
          clientId: r.client_id,
          typeOeuf: r.type_oeuf,
          nombreOeufs: r.nombre_oeufs,
          prixUnitaire: r.prix_unitaire,
          dateReception: r.date_reception ? new Date(r.date_reception).toISOString() : r.date_reception,
          dateMiseEnMachine: r.date_mise_en_machine ? new Date(r.date_mise_en_machine).toISOString() : undefined,
          dateMiragePrevue: r.date_mirage_prevue ? new Date(r.date_mirage_prevue).toISOString() : undefined,
          dateEclosionPrevue: r.date_eclosion_prevue ? new Date(r.date_eclosion_prevue).toISOString() : undefined,
          dateEclosionDemarrage: r.date_eclosion_demarrage ? new Date(r.date_eclosion_demarrage).toISOString() : undefined,
          nomDepart: r.nom_depart ?? undefined,
          statut: r.statut,
          oeufsClairs: r.oeufs_clairs ?? undefined,
          oeufsPourris: r.oeufs_pourris ?? undefined,
          poussinsNes: r.poussins_nes ?? undefined,
          mortsEnCoque: r.morts_en_coque ?? undefined,
          emplacements: r.emplacements ?? undefined,
          emplacementsAvantMirage: r.emplacements_avant_mirage ?? undefined,
          emplacementsApresMirage: r.emplacements_apres_mirage ?? undefined,
          causeEchecMajeure: r.cause_echec_majeure ?? undefined,
          notesEchec: r.notes_echec ?? undefined,
        }
      : null

    return new Response(JSON.stringify({ couvaison }), {
      status: couvaison ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}


})();

// -----------------------------------------------------
// Function: clients_migrate_ids
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["clients_migrate_ids"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  
  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })

    const { data: clients, error } = await client.database
      .from('clients')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const updates = []
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i]
      const newId = `#ICO${i + 1}`
      
      if (c.client_id_ext !== newId) {
        const { error: updateErr } = await client.database
          .from('clients')
          .update({ client_id_ext: newId })
          .eq('id', c.id)
        
        if (!updateErr) {
          updates.push({ id: c.id, old: c.client_id_ext, new: newId })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, migrated: updates.length, list: updates }), {
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

})();

// -----------------------------------------------------
// Function: clients_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["clients_list"] = async function(req: Request) {
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

    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('clients').select('*').range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Match app interface: {id, nom, telephone, clientIdExt}
    const clients = (data ?? []).map((r: any) => ({
      id: r.id,
      nom: r.nom,
      telephone: r.telephone,
      clientIdExt: r.client_id_ext
    }))

    return new Response(JSON.stringify({ clients }), {
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


})();

// -----------------------------------------------------
// Function: client_update
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["client_update"] = async function(req: Request) {
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

    const { id, updates } = body

    if (!id || !updates) {
      return new Response(JSON.stringify({ error: 'Missing id or updates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Map frontend keys to backend database columns
    const dbUpdates: any = { ...updates }
    if (dbUpdates.clientIdExt !== undefined) {
      dbUpdates.client_id_ext = dbUpdates.clientIdExt
      delete dbUpdates.clientIdExt
    }

    const { data: updated, error } = await client.database
      .from('clients')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = updated?.[0]
    const updatedClient = r
      ? {
          id: r.id,
          nom: r.nom,
          telephone: r.telephone,
          clientIdExt: r.client_id_ext
        }
      : null

    return new Response(JSON.stringify({ client: updatedClient }), {
      status: updatedClient ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

})();

// -----------------------------------------------------
// Function: client_messages_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["client_messages_list"] = async function(req: Request) {
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

    
    let baseQuery = client.database.from('client_messages').select('*').order('sent_at', { ascending: false });
    if (clientId) baseQuery = baseQuery.eq('client_id', clientId);
    if (couvaisonId) baseQuery = baseQuery.eq('couvaison_id', couvaisonId);

    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await baseQuery.range(from, from + step - 1);
      if (res.error) { error = res.error; break; }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }

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


})();

// -----------------------------------------------------
// Function: client_message_create
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["client_message_create"] = async function(req: Request) {
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


})();

// -----------------------------------------------------
// Function: client_financial_summary_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["client_financial_summary_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })

    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('client_financial_summary').select('*').range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const summaries = (data || []).map((r: any) => ({
      clientId: r.client_id,
      nom: r.nom,
      telephone: r.telephone,
      clientIdExt: r.client_id_ext,
      totalDu: Number(r.total_du) || 0,
      avoir: Number(r.total_avoir) || 0,
      remise: Number(r.total_remise) || 0,
      dette: Number(r.total_dette) || 0,
      netEncaisse: Number(r.net_encaisse) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      // avoirClient: montant en trop versé (crédit chez le client)
      avoirClient: Number(r.avoir_client) || 0,
      verseJour: Number(r.verse_jour) || 0,
    }))

    return new Response(JSON.stringify({ summaries }), {
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

})();

// -----------------------------------------------------
// Function: client_create
// -----------------------------------------------------
(function() {


localEdgeFunctions["client_create"] = async function(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    
    const { nom, telephone } = await req.json()

    if (!nom || !telephone) {
      return new Response(JSON.stringify({ error: 'Missing nom or telephone' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      })
    }

    const { data: createdClient, error } = await client.database
      .from('clients')
      .insert([{ nom, telephone }])
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ client: createdClient }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}

})();

// -----------------------------------------------------
// Function: ai_expert_advisor
// -----------------------------------------------------
(function() {


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["ai_expert_advisor"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  try {
    const { dataToAnalyze, context } = await req.json().catch(() => ({}))
    if (!dataToAnalyze) throw new Error('Donnees manquantes')

    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })

    const prompt = `
      Tu es l'expert senior de Ivoire Couvée d'Or.
      Analyse ces données : ${JSON.stringify(dataToAnalyze)}
      Contexte : ${context || 'Performance globale'}.
      Fais un rapport détaillé avec recommandations stratégiques (Résumé, Technique, Financier, Recommandations).
    `

    // GPT-4o-mini est ultra rapide et efficace pour ce genre d'analyse
    const aiResponse = await client.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es l expert IA de Ivoire Couvée d Or.' },
        { role: 'user', content: prompt }
      ]
    })

    return new Response(JSON.stringify({ analysis: aiResponse.choices[0].message.content }), {
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

})();

// -----------------------------------------------------
// Function: client_financial_summary_list
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["client_financial_summary_list"] = async function(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })

    const { data, error } = await client.database
      .from('client_financial_summary')
      .select('*')
      .order('nom', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const summaries = (data || []).map((r: any) => ({
      clientId: r.client_id,
      nom: r.nom,
      telephone: r.telephone,
      clientIdExt: r.client_id_ext,
      totalDu: Number(r.total_du) || 0,
      avoir: Number(r.total_avoir) || 0,
      remise: Number(r.total_remise) || 0,
      netEncaisse: Number(r.net_encaisse) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      // avoirClient: montant en trop versé (crédit chez le client)
      avoirClient: Number(r.avoir_client) || 0,
      verseJour: Number(r.verse_jour) || 0,
    }))

    return new Response(JSON.stringify({ summaries }), {
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

})();

// -----------------------------------------------------
// Function: ai_expert_advisor
// -----------------------------------------------------
(function() {
/* eslint-disable @typescript-eslint/no-explicit-any */


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

localEdgeFunctions["ai_expert_advisor"] = async function(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const body = await req.json().catch(() => ({} as any))

    const { dataToAnalyze, context } = body

    if (!dataToAnalyze) {
      return new Response(JSON.stringify({ error: 'Missing data to analyze' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = createClient({ baseUrl, anonKey })

    // Utilisation de l'IA native d'Insforge
    const prompt = `
      Tu es un expert avicole senior et consultant en gestion de couvoir pour l'entreprise "Ivoire Couvée d'Or".
      Analyse les données suivantes et fournis un rapport détaillé, structuré et actionnable.
      
      DONNÉES TECHNIQUES :
      ${JSON.stringify(dataToAnalyze)}
      
      CONTEXTE :
      ${context || 'Analyse de performance globale.'}
      
      FORMAT DE RÉPONSE ATTENDU :
      1. Résumé Exécutif (État de santé de l'activité)
      2. Analyse Technique (Fertilité, Éclosion, Mortalité)
      3. Analyse Financière (Optimisation des revenus, gestion des impayés)
      4. Recommandations Stratégiques (3 points clés à améliorer immédiatement)
      
      Utilise un ton professionnel, encourageant mais direct sur les problèmes.
    `

    const aiResponse = await client.ai.chat({
      model: 'gemini-1.5-pro',
      messages: [
        { role: 'system', content: 'Tu es l expert IA de Ivoire Couvée d Or.' },
        { role: 'user', content: prompt }
      ]
    })

    return new Response(JSON.stringify({ analysis: aiResponse.choices[0].message.content }), {
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

})();
