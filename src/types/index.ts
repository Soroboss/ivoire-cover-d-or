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

export const OEUF_CONFIG: Record<TypeOeuf, { prix: number, jours: number }> = {
  'Poule': { prix: 50, jours: 21 },
  'Pintade': { prix: 50, jours: 26 },
  'Caille': { prix: 50, jours: 18 },
  'Dinde': { prix: 100, jours: 28 },
  'Oie': { prix: 100, jours: 28 },
  'Canard': { prix: 100, jours: 28 },
  'Autre': { prix: 50, jours: 21 }
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
  dateMiragePrevue?: string; // dateMiseEnMachine + 7 jours
  dateEclosionPrevue?: string; // dateMiseEnMachine + jours selon type
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
  causeEchecMajeure?: CauseEchec;
  notesEchec?: string;
}

export interface Transaction {
  id: string;
  couvaisonId: string;
  clientId: string;
  montantTotal: number;
  acomptesVerses: number;
  resteAPayer: number;
  dateTransaction: string;
  typeTransaction: 'Paiement' | 'Avoir';
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
