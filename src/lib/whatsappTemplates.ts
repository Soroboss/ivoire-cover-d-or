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
  let message = (template?.content || '').normalize('NFKD');
  const { client, couvaison, transactions, extra } = data;

  // 1. COLLECT ALL POSSIBLE VARIABLES IN A SINGLE FLAT OBJECT
  const vars: Record<string, string | number> = {
    // Client basics
    client_name: client.nom || '',
    client_tel: client.telephone || '',
    
    // Default numerical fallbacks to '0'
    acompte: '0',
    accompte: '0',
    montant_total: '0',
    reste_a_payer: '0',
    quantite: '0',
    viables: '0',
    poussins: '0',
    clairs: '0',
    pourris: '0',
    taux_fecondite: '0%',
    taux_reussite: '0%',
    details_lots: '',
    detail_lot: '',
    ...extra // Override with specific extra data if provided
  };

  // 2. AUTO-CALCULATE FROM COUVAISON IF PRESENT
  if (couvaison) {
    vars.quantite = couvaison.nombreOeufs || 0;
    vars.type_oeuf = couvaison.typeOeuf || '';
    vars.date_reception = couvaison.dateReception ? format(parseISO(couvaison.dateReception), 'dd/MM/yyyy') : '';
    vars.date_mirage = couvaison.dateMiragePrevue ? format(parseISO(couvaison.dateMiragePrevue), 'dd/MM/yyyy') : '';
    vars.date_eclosion = couvaison.dateEclosionPrevue ? format(parseISO(couvaison.dateEclosionPrevue), 'dd/MM/yyyy') : '';
    
    const v = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
    vars.viables = Math.max(0, v);
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
        .filter(t => t.typeTransaction === 'Encaissement' && (t.penseBete?.includes(couvaison.id) || t.typeVente === 'LO'))
        .reduce((sum, t) => sum + (t.montantTotal || 0), 0);
      
      vars.montant_total = totalDue.toLocaleString();
      vars.reste_a_payer = rest.toLocaleString();
      vars.acompte = paid.toLocaleString();
      vars.accompte = paid.toLocaleString();
    }
  }

  // 3. SPECIAL SCAN AND REPLACE ENGINE (Insensitive to spaces and formatting)
  const smartReplace = (msg: string, key: string, value: string | number) => {
    const val = (value ?? '').toString();
    const k = key.toLowerCase().trim();
    let result = msg;
    const patterns = result.match(/{{\s*[^}]+\s*}}/gi) || [];
    patterns.forEach(p => {
      const cleanP = p.replace(/{{\s*|\s*}}/g, '').toLowerCase().trim().replace(/[\*\_~]/g, '');
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
