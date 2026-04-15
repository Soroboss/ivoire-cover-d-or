import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })

    const body = await req.json().catch(() => ({}))
    const { dataToAnalyze } = body

    if (!dataToAnalyze) {
      return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400, headers: corsHeaders })
    }

    // TEST: On commente l'appel AI pour voir si c'est la source du INVALID_INPUT
    // const aiResponse = await client.ai.chat.completions.create({ ... })

    return new Response(JSON.stringify({ analysis: "Test deployment successful without AI call." }), {
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
