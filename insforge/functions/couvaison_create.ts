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

    const couv = body?.couv
    const clientInfos = body?.clientInfos

    if (!couv || !clientInfos?.telephone) {
      return new Response(JSON.stringify({ error: 'Missing couv or clientInfos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1) Get or create client by telephone
    const { data: existingClient, error: clientErr } = await client.database
      .from('clients')
      .select('*')
      .eq('telephone', clientInfos.telephone)
      .maybeSingle()

    if (clientErr) {
      return new Response(JSON.stringify({ error: clientErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const clientRow =
      existingClient ??
      ((
        await client.database
          .from('clients')
          .insert({
            nom: clientInfos.nom,
            telephone: clientInfos.telephone,
            client_id_ext: `CL-${Math.floor(Date.now() / 1000).toString(36).toUpperCase()}`
          })
          .select()
      ).data?.[0] as any)

    if (!clientRow?.id) {
      return new Response(JSON.stringify({ error: 'Failed to resolve client' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2) Idempotency check
    const idempotencyKey = body.idempotencyKey ?? null
    if (idempotencyKey) {
      const { data: existing } = await client.database
        .from('couvaisons')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existing) {
        const r = existing
        const couvaison = {
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
          poussins_nes: r.poussins_nes ?? undefined,
          mortsEnCoque: r.morts_en_coque ?? undefined,
          emplacements: r.emplacements ?? undefined,
          emplacementsAvantMirage: r.emplacements_avant_mirage ?? undefined,
          emplacementsApresMirage: r.emplacements_apres_mirage ?? undefined,
          causeEchecMajeure: r.cause_echec_majeure ?? undefined,
          notesEchec: r.notes_echec ?? undefined,
        }
        return new Response(JSON.stringify({ couvaison }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 3) Insert couvaison
    const { data: inserted, error: insertErr } = await client.database
      .from('couvaisons')
      .insert({
        client_id: clientRow.id,
        type_oeuf: couv.typeOeuf,
        nombre_oeufs: couv.nombreOeufs,
        prix_unitaire: couv.prixUnitaire,
        date_reception: couv.dateReception,
        date_mise_en_machine: couv.dateMiseEnMachine ?? null,
        date_mirage_prevue: couv.dateMiragePrevue ?? null,
        date_eclosion_prevue: couv.dateEclosionPrevue ?? null,
        date_eclosion_demarrage: couv.dateEclosionDemarrage ?? null,
        nom_depart: couv.nomDepart ?? null,
        statut: couv.statut,
        oeufs_clairs: couv.oeufsClairs ?? null,
        oeufs_pourris: couv.oeufsPourris ?? null,
        poussins_nes: couv.poussinsNes ?? null,
        morts_en_coque: couv.mortsEnCoque ?? null,
        emplacements: couv.emplacements ?? null,
        emplacements_avant_mirage: couv.emplacementsAvantMirage ?? null,
        emplacements_apres_mirage: couv.emplacementsApresMirage ?? null,
        cause_echec_majeure: couv.causeEchecMajeure ?? null,
        notes_echec: couv.notesEchec ?? null,
        idempotency_key: idempotencyKey,
      })
      .select('*')

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const r = inserted?.[0]
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
          emplacementsAvantMirage: r.emplacements_avant_mirage ?? undefined,
          emplacementsApresMirage: r.emplacements_apres_mirage ?? undefined,
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

