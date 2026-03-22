/**
 * Calculs indicatifs de paie — République de Côte d'Ivoire
 *
 * Références usuelles (à valider chaque année auprès de la CNPS et de la DGI) :
 * - Cotisation retraite CNPS (part salarié) : 6,3 % du brut plafonné
 * - Plafond cotisations retraite : 45 × SMIG mensuel (souvent 3 375 000 FCFA)
 * - CMU : contribution forfaitaire mensuelle (part salarié)
 * - ITS : impôt progressif par tranches sur le revenu imposable mensuel
 *
 * Ce module ne remplace pas un conseil juridique ou comptable.
 */

import type { SalarieAgent } from '../types';

/** Plafond mensuel de la base CNPS retraite (part salarié) — à ajuster si le SMIG évolue */
export const PLAFOND_CNPS_RET_RAISONNABLE = 3_375_000;

/** Taux cotisation retraite — part salarié (régime général) */
export const TAUX_CNPS_RETRAITE_SALARIE = 0.063;

/** Forfait CMU côté salarié (montant couramment retenu — vérifier le texte en vigueur) */
export const CMU_FORFAIT_SALARIE_FCFA = 1_000;

export interface BulletinSalaireInput {
  employeurNom: string;
  employeurAdresse?: string;
  employeurNcc?: string;
  salarieNom: string;
  salarieMatricule?: string;
  salarieFonction?: string;
  salarieNumeroCnps?: string;
  periodeMois: number;
  periodeAnnee: number;
  /** Salaire contractuel de base */
  salaireBase: number;
  primesEtIndemnites?: number;
  autresGains?: number;
  /** Retenues sur net (avances, acomptes, etc.) */
  retenuesDiverses?: number;
  /**
   * Réduction pour charges de famille (RICF) — saisie manuelle en FCFA
   * (le barème exact dépend de la situation et des textes DGI en vigueur)
   */
  reductionChargesFamille?: number;
}

export interface LigneBulletin {
  code: string;
  libelle: string;
  base?: number;
  taux?: number;
  montant: number;
  sens: 'gain' | 'retenue' | 'info';
}

export interface BulletinSalaireResultat {
  brut: number;
  lignes: LigneBulletin[];
  totalCotisationsSalariales: number;
  baseImposableITS: number;
  itsBrut: number;
  ricf: number;
  itsNet: number;
  netAPayer: number;
}

/**
 * ITS progressif par tranches (réforme type 2023 — tranches indicatives)
 * Revenu R = base imposable mensuelle (après cotisations salariales prises en compte pour la base ITS)
 */
export function calculITSProgressif(revenuImposable: number): number {
  const R = Math.max(0, revenuImposable);
  if (R <= 75_000) return 0;

  let tax = 0;
  if (R > 75_000) {
    tax += (Math.min(R, 240_000) - 75_000) * 0.16;
  }
  if (R > 240_000) {
    tax += (Math.min(R, 800_000) - 240_000) * 0.21;
  }
  if (R > 800_000) {
    tax += (Math.min(R, 2_400_000) - 800_000) * 0.24;
  }
  if (R > 2_400_000) {
    tax += (Math.min(R, 8_000_000) - 2_400_000) * 0.28;
  }
  if (R > 8_000_000) {
    tax += (R - 8_000_000) * 0.32;
  }
  return Math.round(tax);
}

export function calculerBulletinSalaire(input: BulletinSalaireInput): BulletinSalaireResultat {
  const base = Math.max(0, input.salaireBase || 0);
  const primes = Math.max(0, input.primesEtIndemnites ?? 0);
  const autres = Math.max(0, input.autresGains ?? 0);
  const brut = base + primes + autres;

  const plafonne = Math.min(brut, PLAFOND_CNPS_RET_RAISONNABLE);
  const cnpsRetraite = Math.round(plafonne * TAUX_CNPS_RETRAITE_SALARIE * 100) / 100;
  const cmu = CMU_FORFAIT_SALARIE_FCFA;

  const totalCotisations = cnpsRetraite + cmu;

  /** Base ITS simplifiée : brut − cotisations salariales légales retenues ici */
  const baseImposableITS = Math.max(0, brut - totalCotisations);
  const itsBrut = calculITSProgressif(baseImposableITS);
  const ricf = Math.max(0, input.reductionChargesFamille ?? 0);
  const itsNet = Math.max(0, itsBrut - ricf);

  const retenues = Math.max(0, input.retenuesDiverses ?? 0);
  const netAPayer = Math.max(0, brut - totalCotisations - itsNet - retenues);

  const libelleITS =
    ricf > 0
      ? `ITS net (brut ${itsBrut.toLocaleString('fr-FR')} F − RICF ${ricf.toLocaleString('fr-FR')} F)`
      : 'ITS — Impôt sur traitements & salaires';

  const lignes: LigneBulletin[] = [
    { code: 'BASE', libelle: 'Salaire de base', montant: base, sens: 'gain' },
  ];
  if (primes > 0) {
    lignes.push({ code: 'PRIME', libelle: 'Primes & indemnités', montant: primes, sens: 'gain' });
  }
  if (autres > 0) {
    lignes.push({ code: 'AUTRE', libelle: 'Autres gains imposables', montant: autres, sens: 'gain' });
  }
  lignes.push({ code: 'BRUT', libelle: 'TOTAL BRUT', montant: brut, sens: 'info' });

  lignes.push({
    code: 'CNPS-R',
    libelle: 'CNPS — Retraite (part salarié)',
    base: plafonne,
    taux: TAUX_CNPS_RETRAITE_SALARIE,
    montant: cnpsRetraite,
    sens: 'retenue',
  });
  lignes.push({
    code: 'CMU',
    libelle: 'CMU (part salarié, forfait)',
    montant: cmu,
    sens: 'retenue',
  });

  lignes.push({
    code: 'BASE-ITS',
    libelle: 'Base imposable ITS (après cotisations)',
    montant: baseImposableITS,
    sens: 'info',
  });
  lignes.push({
    code: 'ITS',
    libelle: libelleITS,
    montant: itsNet,
    sens: 'retenue',
  });
  if (retenues > 0) {
    lignes.push({
      code: 'RET',
      libelle: 'Retenues diverses (avances, etc.)',
      montant: retenues,
      sens: 'retenue',
    });
  }
  lignes.push({
    code: 'NET',
    libelle: 'NET À PAYER',
    montant: netAPayer,
    sens: 'info',
  });

  return {
    brut,
    lignes,
    totalCotisationsSalariales: totalCotisations,
    baseImposableITS,
    itsBrut,
    ricf,
    itsNet,
    netAPayer,
  };
}

export const MENTION_LEGALE_PAIE_CI =
  'Document généré à titre indicatif. Les barèmes CNPS, CMU et ITS ainsi que la RICF doivent être vérifiés ' +
  'pour la période considérée (CNPS, Direction Générale des Impôts — DGI).';

/**
 * Applique la fiche salarié (rémunération décidée par l’entrepreneur) au bulletin en cours.
 * Conserve employeur, adresse, NCC et période déjà saisis.
 */
export function bulletinInputFromSalarieAgent(
  agent: SalarieAgent,
  previous: BulletinSalaireInput,
): BulletinSalaireInput {
  return {
    ...previous,
    salarieNom: agent.nom,
    salarieMatricule: agent.matricule ?? '',
    salarieFonction: agent.fonction ?? '',
    salarieNumeroCnps: agent.numeroCnps ?? '',
    salaireBase: agent.salaireMensuelBrut,
    primesEtIndemnites: agent.primesDefaut ?? 0,
    autresGains: agent.autresGainsDefaut ?? 0,
    retenuesDiverses: agent.retenuesDiversesDefaut ?? 0,
    reductionChargesFamille: agent.reductionChargesFamilleDefaut ?? 0,
  };
}
