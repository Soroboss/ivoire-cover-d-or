import type { MessageTemplate, Client, Couvaison, Transaction } from '../types';
import { format, parseISO } from 'date-fns';
import { resteLot } from './financeCalculations';

export const formatWhatsAppMessage = (
  template: MessageTemplate,
  data: {
    client: Client;
    couvaison?: Couvaison;
    transactions?: Transaction[];
    extra?: Record<string, string | number>;
  }
) => {
  let message = (template?.content || '').normalize('NFKD').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const { client, couvaison, transactions, extra } = data;

  // 1. COLLECT ALL POSSIBLE VARIABLES IN A SINGLE FLAT OBJECT
  const vars: Record<string, string | number> = {
    // Client basics
    client_name: client.nom || '',
    client_tel: client.telephone || '',
    
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
    taux_eclosion: '0',
    details_lots: '',
    detail_lot: '',
    detail_des_lots: '',
    ...extra // Override with specific extra data if provided
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
      vars.taux_reussite = ((couvaison.poussinsNes / v) * 100).toFixed(1) + '%';
    }

    // Auto-calculate Financials if transactions are present
    if (transactions) {
      const totalDue = (couvaison.nombreOeufs || 0) * (couvaison.prixUnitaire || 0);
      const rest = resteLot(transactions, couvaison.id, totalDue);
      const paid = transactions
        .filter(t => (t.typeTransaction as string) === 'Paiement' && t.couvaisonId === couvaison.id)
        .reduce((sum, t) => sum + (t.montantTotal || 0), 0);
      
      vars.montant_total = totalDue.toLocaleString();
      vars.reste_a_payer = rest.toLocaleString();
      vars.acompte = paid.toLocaleString();
      vars.accompte = paid.toLocaleString();
    }
  }

  // 3. CONDITIONALS (re-calculated after all auto-calculations)
  const rIndex = vars.reste_a_payer.toString().replace(/[^\d]/g, '');
  const rValue = parseInt(rIndex, 10) || 0;
  vars.instruction_paiement = rValue > 0 
    ? "Veuillez prévoir le règlement total pour récupérer vos poussins." 
    : "Votre lot est entièrement réglé. Merci !";

  // 3. SPECIAL SCAN AND REPLACE ENGINE (Insensitive to spaces and formatting)
  const smartReplace = (msg: string, key: string, value: string | number) => {
    const val = (value ?? '').toString();
    const k = key.toLowerCase().trim().replace(/_/g, ''); // Strip underscores for mapping
    
    let result = msg;
    const patterns = result.match(/{{\s*[^}]+\s*}}/gi) || [];
    patterns.forEach(p => {
      // Clean up the placeholder: remove braces, lowercase, trim, AND strip common markdown markers
      // We ALSO strip underscores just for the comparison so that {{nom_depart}} matches "nom_depart"
      const cleanP = p.replace(/{{\s*|\s*}}/g, '')
                      .toLowerCase()
                      .trim()
                      .replace(/[\*\_~]/g, ''); // strip * _ ~ and underscores
                      
      if (cleanP === k) {
        result = result.split(p).join(val);
      }
    });

    // Final safety exact match
    result = result.split(`{{${key}}}`).join(val);
    result = result.split(`{{ ${key} }}`).join(val);
    
    return result;
  };

  // 4. APPLY ALL COLLECTED VARIABLES
  Object.entries(vars).forEach(([key, val]) => {
    message = smartReplace(message, key, val);
  });

  return message;
};

export const normalizePhoneForWhatsApp = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned.substring(1);
  if (cleaned.length === 10) return '225' + cleaned;
  return cleaned;
};
