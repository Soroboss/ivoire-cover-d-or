import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  try {
    const { dataToAnalyze, context } = await req.json().catch(() => ({}))
    if (!dataToAnalyze) throw new Error('Donnees manquantes')

    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })

    const prompt = `
      Tu es l'expert senior de Ivoire Couvée d'Or.
      Analyse ces données : ${JSON.stringify(dataToAnalyze)}
      Contexte : ${context || 'Performance globale'}.
      Fais un rapport détaillé avec recommandations stratégiques (Résumé, Technique, Financier, Recommandations).
    `

    // GPT-4o-mini est ultra rapide et efficace pour ce genre d'analyse
    const aiResponse = await client.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es l expert IA de Ivoire Couvée d Or.' },
        { role: 'user', content: prompt }
      ]
    })

    return new Response(JSON.stringify({ analysis: aiResponse.choices[0].message.content }), {
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
