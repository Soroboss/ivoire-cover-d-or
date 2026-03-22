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
    const id = body?.id
    const updates = body?.updates ?? {}

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const updateValues: any = {}
    if (updates.dateDepense !== undefined) updateValues.date_depense = updates.dateDepense
    if (updates.categorie !== undefined) updateValues.categorie = updates.categorie
    if (updates.libelle !== undefined) updateValues.libelle = updates.libelle
    if (updates.montant !== undefined) {
      const m = Number(updates.montant)
      if (m < 0 || Number.isNaN(m)) {
        return new Response(JSON.stringify({ error: 'Montant invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      updateValues.montant = m
    }
    if (updates.notes !== undefined) updateValues.notes = updates.notes ?? null

    if (Object.keys(updateValues).length === 0) {
      return new Response(JSON.stringify({ error: 'Aucune mise à jour' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: updated, error } = await client.database.from('depenses').update(updateValues).eq('id', id).select('*')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const r = updated?.[0]
    if (!r) {
      return new Response(JSON.stringify({ error: 'Dépense introuvable' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
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
