/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const body = await req.json().catch(() => ({} as any))

    const { dataToAnalyze, context } = body

    if (!dataToAnalyze) {
      return new Response(JSON.stringify({ error: 'Missing data to analyze' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = createClient({ baseUrl, anonKey })

    // Utilisation de l'IA native d'Insforge
    const prompt = `
      Tu es un expert avicole senior et consultant en gestion de couvoir pour l'entreprise "Ivoire Couvée d'Or".
      Analyse les données suivantes et fournis un rapport détaillé, structuré et actionnable.
      
      DONNÉES TECHNIQUES :
      ${JSON.stringify(dataToAnalyze)}
      
      CONTEXTE :
      ${context || 'Analyse de performance globale.'}
      
      FORMAT DE RÉPONSE ATTENDU :
      1. Résumé Exécutif (État de santé de l'activité)
      2. Analyse Technique (Fertilité, Éclosion, Mortalité)
      3. Analyse Financière (Optimisation des revenus, gestion des impayés)
      4. Recommandations Stratégiques (3 points clés à améliorer immédiatement)
      
      Utilise un ton professionnel, encourageant mais direct sur les problèmes.
    `

    const aiResponse = await client.ai.chat({
      model: 'gemini-1.5-pro',
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
