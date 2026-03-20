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
    if (updates.statut !== undefined) updateValues.statut = updates.statut
    if (updates.oeufsClairs !== undefined) updateValues.oeufs_clairs = updates.oeufsClairs
    if (updates.oeufsPourris !== undefined) updateValues.oeufs_pourris = updates.oeufsPourris
    if (updates.poussinsNes !== undefined) updateValues.poussins_nes = updates.poussinsNes
    if (updates.mortsEnCoque !== undefined) updateValues.morts_en_coque = updates.mortsEnCoque
    if (updates.dateMiseEnMachine !== undefined) updateValues.date_mise_en_machine = updates.dateMiseEnMachine ?? null
    if (updates.dateMiragePrevue !== undefined) updateValues.date_mirage_prevue = updates.dateMiragePrevue ?? null
    if (updates.dateEclosionPrevue !== undefined) updateValues.date_eclosion_prevue = updates.dateEclosionPrevue ?? null
    if (updates.dateEclosionDemarrage !== undefined) updateValues.date_eclosion_demarrage = updates.dateEclosionDemarrage ?? null
    if (updates.nomDepart !== undefined) updateValues.nom_depart = updates.nomDepart ?? null
    if (updates.causeEchecMajeure !== undefined) updateValues.cause_echec_majeure = updates.causeEchecMajeure ?? null
    if (updates.notesEchec !== undefined) updateValues.notes_echec = updates.notesEchec ?? null
    if (updates.emplacements !== undefined) updateValues.emplacements = updates.emplacements ?? null

    const { data: updated, error } = await client.database
      .from('couvaisons')
      .update(updateValues)
      .eq('id', id)
      .select('*')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = updated?.[0]
    const couvaison = r
      ? {
          id: r.id,
          clientId: r.client_id,
          typeOeuf: r.type_oeuf,
          nombreOeufs: r.nombre_oeufs,
          prixUnitaire: r.prix_unitaire,
          dateReception: r.date_reception ? new Date(r.date_reception).toISOString() : r.date_reception,
          dateMiseEnMachine: r.date_mise_en_machine ? new Date(r.date_mise_en_machine).toISOString() : undefined,
          dateMiragePrevue: r.date_mirage_prevue ? new Date(r.date_mirage_prevue).toISOString() : undefined,
          dateEclosionPrevue: r.date_eclosion_prevue ? new Date(r.date_eclosion_prevue).toISOString() : undefined,
          dateEclosionDemarrage: r.date_eclosion_demarrage ? new Date(r.date_eclosion_demarrage).toISOString() : undefined,
          nomDepart: r.nom_depart ?? undefined,
          statut: r.statut,
          oeufsClairs: r.oeufs_clairs ?? undefined,
          oeufsPourris: r.oeufs_pourris ?? undefined,
          poussinsNes: r.poussins_nes ?? undefined,
          mortsEnCoque: r.morts_en_coque ?? undefined,
          emplacements: r.emplacements ?? undefined,
          causeEchecMajeure: r.cause_echec_majeure ?? undefined,
          notesEchec: r.notes_echec ?? undefined,
        }
      : null

    return new Response(JSON.stringify({ couvaison }), {
      status: couvaison ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

