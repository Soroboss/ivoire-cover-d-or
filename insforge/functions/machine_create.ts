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

