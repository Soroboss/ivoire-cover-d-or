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

    const { data, error } = await client.database.from('salaire_agents').insert(payload).select('*')
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
