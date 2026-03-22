export type StatutCouvaison = 'En attente' | 'En cours' | 'Terminé' | 'Annulé';
export type TypeOeuf = 'Poule' | 'Canard' | 'Dinde' | 'Caille' | 'Pintade' | 'Oie' | 'Autre';
export type TypeMachine = 'Couveuse' | 'Éclosoir' | 'Mixte';
export type Role = 'Admin' | 'Technicien' | 'Réception/Caisse';

/** Droits d’accès (menu / routes), modifiables par cases à cocher (stockés dans profile.permissions côté InsForge) */
export type PermissionKey =
  | 'dashboard'
  | 'couvaisons'
  | 'clients'
  | 'machines'
  | 'analyses'
  | 'finances'
  | 'factures'
  | 'historique'
  | 'administration';
export type CauseEchec = 'Infertilité' | 'Coupure Électrique' | 'Température/Humidité' | 'Infection' | 'Manutention' | 'Autre' | 'Aucune';

/** prix : FCFA / œuf ; jours : réception → éclosion prévue (aligné sur couvaisonPlanning) */
export const OEUF_CONFIG: Record<TypeOeuf, { prix: number, jours: number }> = {
  'Poule': { prix: 50, jours: 20 },
  'Pintade': { prix: 50, jours: 25 },
  'Caille': { prix: 50, jours: 17 },
  'Dinde': { prix: 100, jours: 26 },
  'Oie': { prix: 100, jours: 26 },
  'Canard': { prix: 100, jours: 26 },
  'Autre': { prix: 50, jours: 26 },
};

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CRÉATION' | 'MODIFICATION' | 'SUPPRESSION' | 'SYSTÈME';
  target: string;
  details: string;
  timestamp: string;
}

export interface Casier {
  id: string;
  nom: string;
  capacite: number;
}

export interface Machine {
  id: string;
  nom: string;
  capacite: number;
  type: TypeMachine;
  enService: boolean;
  casiers: Casier[];
}

export interface User {
  id: string;
  nom: string;
  username: string;
  telephone?: string;
  passwordHash: string;
  role: Role;
  actif: boolean;
  /** Liste effective après résolution (profil + rôle). Absent = recalcul côté client. */
  permissions?: PermissionKey[];
  /** Compte admin projet InsForge → accès total */
  isProjectAdmin?: boolean;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string;
}

export interface Couvaison {
  id: string;
  clientId: string;
  typeOeuf: TypeOeuf;
  nombreOeufs: number;
  prixUnitaire: number;
  dateReception: string; // ISO string
  dateMiseEnMachine?: string; // ISO string
  dateMiragePrevue?: string; // jour réception + 14 j. (calcul au placement)
  dateEclosionPrevue?: string; // jour réception + jours selon type (calcul au placement)
  // Enregistrement du démarrage réel de l'éclosion
  dateEclosionDemarrage?: string; // ISO string
  nomDepart?: string;
  statut: StatutCouvaison;
  
  // Résultats mirage
  oeufsClairs?: number;
  oeufsPourris?: number;
  
  // Résultats éclosion
  poussinsNes?: number;
  mortsEnCoque?: number;
  
  // V3: Placements en casiers
  emplacements?: { machineId: string, casierId: string, quantite: number }[];
  /** Snapshot au moment du 1er enregistrement mirage (tiroirs avant) */
  emplacementsAvantMirage?: { machineId: string, casierId: string, quantite: number }[];
  /** Tiroirs après mirage (maj si repositionnement) */
  emplacementsApresMirage?: { machineId: string, casierId: string, quantite: number }[];
  causeEchecMajeure?: CauseEchec;
  notesEchec?: string;
}

export type TypeTransaction = 'Paiement' | 'Avoir' | 'Remise' | 'Deduction';

export interface Transaction {
  id: string;
  couvaisonId: string;
  clientId: string;
  montantTotal: number;
  acomptesVerses: number;
  resteAPayer: number;
  dateTransaction: string;
  typeTransaction: TypeTransaction;
  notes?: string;
}

export interface ReceiptArchive {
  id: string;
  clientId: string;
  invoiceNumber: string;
  fileName: string;
  totalAmount: number;
  totalPaid: number;
  totalCredits: number;
  dueAmount: number;
  couvaisonsCount: number;
  transactionsCount: number;
  generatedByUserId?: string;
  generatedByName?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface ClientMessage {
  id: string;
  clientId: string;
  couvaisonId?: string;
  canal: 'WhatsApp' | 'SMS' | 'Email' | 'Autre';
  statut: 'Envoye' | 'Echec' | 'Planifie';
  template?: string;
  message: string;
  sentByUserId?: string;
  sentByName?: string;
  sentAt: string;
}

/** Catégories de charges (hors flux clients) — loyer, énergie, masse salariale, etc. */
export type CategorieDepense =
  | 'Loyer'
  | 'Electricite'
  | 'Eau'
  | 'Salaires'
  | 'Fournitures'
  | 'Transport'
  | 'Maintenance'
  | 'Quotidien'
  | 'Autre';

export const CATEGORIE_DEPENSE_LABELS: Record<CategorieDepense, string> = {
  Loyer: 'Loyer & locaux',
  Electricite: 'Électricité',
  Eau: 'Eau',
  Salaires: 'Salaires & charges sociales',
  Fournitures: 'Fournitures & alimentation',
  Transport: 'Transport & carburant',
  Maintenance: 'Maintenance & équipement',
  Quotidien: 'Dépenses courantes',
  Autre: 'Autres charges',
};

export const CATEGORIES_DEPENSE_ORDER: CategorieDepense[] = [
  'Loyer',
  'Electricite',
  'Eau',
  'Salaires',
  'Fournitures',
  'Transport',
  'Maintenance',
  'Quotidien',
  'Autre',
];

export interface Depense {
  id: string;
  dateDepense: string;
  categorie: CategorieDepense | string;
  libelle: string;
  montant: number;
  notes?: string;
  createdAt: string;
}
