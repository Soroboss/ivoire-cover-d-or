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
