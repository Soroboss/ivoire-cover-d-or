/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

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
