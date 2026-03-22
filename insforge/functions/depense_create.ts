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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      anonKey: Deno.env.get('ANON_KEY') || '',
    })
    const body = await req.json().catch(() => ({} as any))

    const montant = Number(body.montant) ?? 0
    if (montant < 0 || Number.isNaN(montant)) {
      return new Response(JSON.stringify({ error: 'Montant invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const payload = {
      date_depense: body.dateDepense ?? new Date().toISOString(),
      categorie: String(body.categorie || '').trim() || 'Autre',
      libelle: String(body.libelle || '').trim(),
      montant,
      notes: body.notes != null ? String(body.notes) : null,
    }

    if (!payload.libelle) {
      return new Response(JSON.stringify({ error: 'Libellé requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data, error } = await client.database.from('depenses').insert(payload).select('*')
    if (error || !data?.[0]) {
      return new Response(JSON.stringify({ error: error?.message || 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r: any = data[0]
    const depense = {
      id: r.id,
      dateDepense: r.date_depense ? new Date(r.date_depense).toISOString() : new Date().toISOString(),
      categorie: r.categorie,
      libelle: r.libelle,
      montant: Number(r.montant) || 0,
      notes: r.notes ?? undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }
    return new Response(JSON.stringify({ depense }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}
