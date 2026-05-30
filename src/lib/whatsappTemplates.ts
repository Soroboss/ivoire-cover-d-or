import type { MessageTemplate, Client, Couvaison, Transaction, ClientFinancialSummary } from '../types';
import { format, parseISO } from 'date-fns';
import { resteLot, getClientGlobalBalance } from './financeCalculations';

export const formatWhatsAppMessage = (
  template: MessageTemplate,
  data: {
    client: Client;
    couvaison?: Couvaison;
    couvaisons?: Couvaison[]; // Pass couvaisons to calculate global balance
    transactions?: Transaction[];
    clientSummaries?: ClientFinancialSummary[];
    extra?: Record<string, string | number>;
  }
) => {
  let message = (template?.content || '').normalize('NFKD').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const { client, couvaison, couvaisons, transactions, clientSummaries, extra } = data;

  // 1. COLLECT ALL POSSIBLE VARIABLES IN A SINGLE FLAT OBJECT
  const vars: Record<string, string | number> = {
    // Client basics
    client_name: client.nom || '',
    client_tel: client.telephone || '',
    client_id_ext: client?.id ? client.id.split('-')[0].toUpperCase() : 'NOUVEAU',
    client_id: client?.id ? client.id.split('-')[0].toUpperCase() : 'NOUVEAU',
    
    // Default numerical fallbacks to '0'
    acompte: '0',
    accompte: '0',
    avance: '0',
    montant_total: '0',
    total: '0',
    montant: '0',
    reste_a_payer: '0',
    reste: '0',
    solde: '0',
    quantite: '0',
    nombre: '0',
    viables: '0',
    fertile: '0',
    poussins: '0',
    poussins_nes: '0',
    clairs: '0',
    pourris: '0',
    taux_fecondite: '0%',
    taux_reussite: '0%',
    taux_eclosion: '0%',
    ratio_eclosion: '0 / 0',
    delta_nes: '0',
    nouveaux_poussins: '0',
    details_lots: '',
    detail_lot: '',
    detail_des_lots: '',
    nom_depart: '',
    montant_paye: '0',
  };

  // 2. AUTO-CALCULATE FROM COUVAISON IF PRESENT
  if (couvaison) {
    vars.quantite = couvaison.nombreOeufs || 0;
    vars.type_oeuf = couvaison.typeOeuf || '';
    vars.date_reception = couvaison.dateReception ? format(parseISO(couvaison.dateReception), 'dd/MM/yyyy') : '';
    vars.date_mise_en_machine = couvaison.dateMiseEnMachine ? format(parseISO(couvaison.dateMiseEnMachine), 'dd/MM/yyyy') : 'À définir';
    vars.date_mirage = couvaison.dateMiragePrevue ? format(parseISO(couvaison.dateMiragePrevue), 'dd/MM/yyyy') : '';
    vars.date_eclosion = couvaison.dateEclosionPrevue ? format(parseISO(couvaison.dateEclosionPrevue), 'dd/MM/yyyy') : '';
    vars.date_demarrage_eclosion = couvaison.dateEclosionDemarrage ? format(parseISO(couvaison.dateEclosionDemarrage), 'dd/MM/yyyy') : 'À définir';
    vars.nom_depart = couvaison.nomDepart || '';
    
    const v = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
    vars.viables = Math.max(0, v);
    vars.fertile = vars.viables;
    
    // Auto-detail if not provided
    if (!vars.details_lots || vars.details_lots === '') {
      const line = `- ${couvaison.nombreOeufs} ${couvaison.typeOeuf}s (Total: ${((couvaison.nombreOeufs || 0) * (couvaison.prixUnitaire || 0)).toLocaleString()} F)`;
      vars.details_lots = line;
      vars.detail_lot = line;
      vars.detail_des_lots = line;
    }
    vars.clairs = couvaison.oeufsClairs || 0;
    vars.pourris = couvaison.oeufsPourris || 0;
    vars.poussins = couvaison.poussinsNes || 0;
    vars.poussins_nes = couvaison.poussinsNes || 0;

    if (couvaison.nombreOeufs) {
      vars.taux_fecondite = ((v / couvaison.nombreOeufs) * 100).toFixed(1) + '%';
    }
    if (v > 0 && couvaison.poussinsNes !== undefined) {
      const rate = ((couvaison.poussinsNes / v) * 100).toFixed(1);
      const tr = rate + '%';
      vars.taux_reussite = tr;
      vars.taux_eclosion = tr;
      vars.ratio_eclosion = `${couvaison.poussinsNes} / ${v} (${tr})`;
    }

    // Identifiant court ou ID complet
    vars.couvaison_id = couvaison?.id ? couvaison.id.split('-')[0].toUpperCase() : 'NOUVEAU';
    vars.id_couvaison = vars.id_couvaison_ext || vars.couvaison_id;

    // Auto-calculate Financials if transactions are present
    if (transactions) {
      const totalDue = (couvaison.nombreOeufs || 0) * (couvaison.prixUnitaire || 0);
      const rest = resteLot(transactions, couvaison.id, totalDue);
      const paid = transactions
        .filter(t => (t.typeTransaction as string) === 'Paiement' && t.couvaisonId === couvaison.id)
        .reduce((sum, t) => sum + (t.montantTotal || 0), 0);
      
      const remises = transactions
        .filter(t => (t.typeTransaction as string) === 'Remise' && t.couvaisonId === couvaison.id)
        .reduce((sum, t) => sum + (t.montantTotal || 0), 0);
      
      const avoirs = transactions
        .filter(t => (t.typeTransaction as string) === 'Avoir' && t.couvaisonId === couvaison.id)
        .reduce((sum, t) => sum + (t.montantTotal || 0), 0);
      
      vars.montant_total = totalDue.toLocaleString();
      vars.montant_du = totalDue.toLocaleString();
      vars.reste_a_payer = rest.toLocaleString();
      vars.acompte = paid.toLocaleString();
      vars.remise = remises > 0 ? remises.toLocaleString() + ' F' : '-';
      vars.avoir = avoirs > 0 ? avoirs.toLocaleString() + ' F' : '-';
      vars.net_encaisse = paid.toLocaleString();
      
      if (couvaisons) {
        vars.total_global = getClientGlobalBalance(transactions, couvaisons, client.id, clientSummaries).toLocaleString();
      } else {
        vars.total_global = rest.toLocaleString();
      }
    }
  }

  // 3. OVERRIDE WITH EXTRA DATA (Moved here to ensure it wins)
  if (extra) {
    Object.assign(vars, extra);
  }

  // Final touches on combined variables
  if (couvaison) {
    const v = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
    const finalNes = vars.delta_nes !== undefined ? (Number(vars.delta_nes) + (couvaison.poussinsNes || 0)) : (couvaison.poussinsNes || 0);
    const totalNes = vars.poussins_nes || finalNes;
    const rate = v > 0 ? ((Number(totalNes) / v) * 100).toFixed(1) : '0';
    vars.ratio_eclosion = `${totalNes}/${v} (${rate}%)`;
  }

  // 4. CONDITIONALS (re-calculated after all auto-calculations)
  const rIndex = (vars.reste_a_payer || '0').toString().replace(/[^\d]/g, '');
  const rValue = parseInt(rIndex, 10) || 0;
  vars.instruction_paiement = rValue > 0 
    ? "Veuillez prévoir le règlement total pour récupérer vos poussins." 
    : "Votre lot est entièrement réglé. Merci !";

  // 5. SPECIAL SCAN AND REPLACE ENGINE (Insensitive to spaces and formatting)
  const smartReplace = (msg: string, key: string, value: string | number) => {
    const val = (value ?? '').toString();
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanKey) return msg;

    // Direct global replacement for common variations
    let result = msg;
    
    // Replacement via generalized regex callback
    result = result.replace(/{{\s*([^}]+)\s*}}/gi, (match, p1) => {
      const cleanP = p1.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanP === cleanKey ? val : match;
    });

    return result;
  };

  // 6. APPLY ALL COLLECTED VARIABLES
  Object.entries(vars).forEach(([key, val]) => {
    message = smartReplace(message, key, val);
  });

  return message;
};

export const normalizePhoneForWhatsApp = (phone?: string) => {
  if (!phone) return '';
  // Supprimer tout ce qui n'est pas un chiffre
  let cleaned = phone.replace(/\D/g, '');
  
  // Si le numéro commence par 00, on considère que c'est un préfixe international
  if (phone.startsWith('00')) cleaned = cleaned.substring(2);
  // Si le numéro commence par +, on a déjà géré ça avec \D (le + est supprimé)
  
  // Cas spécifique Côte d'Ivoire : 10 chiffres commençant par 0
  if (cleaned.length === 10 && (cleaned.startsWith('01') || cleaned.startsWith('05') || cleaned.startsWith('07'))) {
    return '225' + cleaned;
  }
  
  // Si on a 10 chiffres mais pas de 225 au début, on ajoute 225 par prédiction (contexte local)
  if (cleaned.length === 10 && !cleaned.startsWith('225')) {
    return '225' + cleaned;
  }

  return cleaned;
};

/** Ouvre WhatsApp systématiquement dans un nouvel onglet sans quitter le logiciel. */
export const openWhatsApp = (phone: string, message: string) => {
  const cleanPhone = normalizePhoneForWhatsApp(phone);
  if (!cleanPhone) return;

  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  
  // On utilise une approche robuste par lien invisible pour forcer le target="_blank"
  // et minimiser les blocages par les navigateurs tout en préservant l'onglet actif.
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  
  try {
    // Tentative 1: window.open (plus propre si ça passe)
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Si window.open est bloqué, on tente le clic sur le lien
      link.click();
    } else {
      win.focus();
    }
  } catch (e) {
    // Tentative 2: Fallback clic sur le lien
    link.click();
  } finally {
    // Nettoyage différé pour laisser le temps au navigateur de traiter le clic
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
  }
};
