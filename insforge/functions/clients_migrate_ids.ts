/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
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
