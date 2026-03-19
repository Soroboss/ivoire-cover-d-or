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

