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

