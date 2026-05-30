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
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })

    
    let data: any[] = [];
    let error: any = null;
    let from = 0;
    const step = 1000;
    while (true) {
      const res = await client.database.from('client_financial_summary').select('*').range(from, from + step - 1);
      if (res.error) {
        error = res.error;
        break;
      }
      if (res.data) data = data.concat(res.data);
      if (!res.data || res.data.length < step) break;
      from += step;
    }


    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const summaries = (data || []).map((r: any) => ({
      clientId: r.client_id,
      nom: r.nom,
      telephone: r.telephone,
      clientIdExt: r.client_id_ext,
      totalDu: Number(r.total_du) || 0,
      avoir: Number(r.total_avoir) || 0,
      remise: Number(r.total_remise) || 0,
      dette: Number(r.total_dette) || 0,
      netEncaisse: Number(r.net_encaisse) || 0,
      resteAPayer: Number(r.reste_a_payer) || 0,
      // avoirClient: montant en trop versé (crédit chez le client)
      avoirClient: Number(r.avoir_client) || 0,
      verseJour: Number(r.verse_jour) || 0,
    }))

    return new Response(JSON.stringify({ summaries }), {
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
