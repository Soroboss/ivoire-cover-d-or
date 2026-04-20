/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
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
