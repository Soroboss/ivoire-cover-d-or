/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const client = createClient({ baseUrl, anonKey })

    const { data, error } = await client.database
      .from('couvaisons')
      .select('*')
      .order('date_reception', { ascending: false })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const couvaisons = (data ?? []).map((r: any) => ({
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
    }))

    return new Response(JSON.stringify({ couvaisons }), {
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

