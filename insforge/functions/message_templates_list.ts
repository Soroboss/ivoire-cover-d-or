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
