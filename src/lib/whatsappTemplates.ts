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
  let message = template?.content || '';
  const { client, couvaison, transactions, extra } = data;

  // Helper for case-insensitive and space-tolerant replacement
  const smartReplace = (msg: string, key: string, value: string | number) => {
    const val = (value ?? '').toString();
    const k = key.toLowerCase();
    
    let result = msg;
    
    // We scan the message for ALL {{ ... }} patterns and check if they match our key
    const patterns = result.match(/{{\s*[^}]+\s*}}/gi) || [];
    patterns.forEach(p => {
      const cleanP = p.replace(/{{\s*|\s*}}/g, '').toLowerCase().trim();
      if (cleanP === k) {
        result = result.split(p).join(val);
      }
    });

    // Fallbacks for the exact key
    result = result.split(`{{${key}}}`).join(val);
    result = result.split(`{{ ${key} }}`).join(val);
    
    return result;
  };

  // 1. Process EXTRA variables (highest priority)
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      message = smartReplace(message, key, value);
    });
  }

  // 2. Client Info
  message = smartReplace(message, 'client_name', client.nom || '');

  // 3. Couvaison / Lot Info
  if (couvaison) {
    message = smartReplace(message, 'quantite', couvaison.nombreOeufs || 0);
    message = smartReplace(message, 'type_oeuf', couvaison.typeOeuf || '');
    message = smartReplace(message, 'date_reception', couvaison.dateReception || '');
    message = smartReplace(message, 'date_mirage', couvaison.dateMiragePrevue || '');
    message = smartReplace(message, 'date_eclosion', couvaison.dateEclosionPrevue || '');
    
    // Format dates if they look like ISO strings
    const dateVars = ['date_reception', 'date_mirage', 'date_eclosion'];
    dateVars.forEach(v => {
      const current = (couvaison as any)[v === 'date_reception' ? 'dateReception' : v === 'date_mirage' ? 'dateMiragePrevue' : 'dateEclosionPrevue'];
      if (current && typeof current === 'string' && current.includes('-')) {
        try {
          const formatted = format(parseISO(current), 'dd/MM/yyyy');
          message = smartReplace(message, v, formatted);
        } catch (e) {}
      }
    });

    // Technical Results
    const viables = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
    message = smartReplace(message, 'fertile', couvaison.oeufsFertiles || viables);
    message = smartReplace(message, 'clairs', couvaison.oeufsClairs || 0);
    message = smartReplace(message, 'pourris', couvaison.oeufsPourris || 0);
    message = smartReplace(message, 'poussins', couvaison.poussinsNes || 0);
    
    const tauxFec = (couvaison.nombreOeufs || 0) > 0 ? (viables / couvaison.nombreOeufs) * 100 : 0;
    message = smartReplace(message, 'taux_fecondite', tauxFec.toFixed(1) + '%');

    if (couvaison.poussinsNes !== undefined) {
      const oeufsRestants = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
      const tauxEcl = oeufsRestants > 0 ? (couvaison.poussinsNes / oeufsRestants) * 100 : 0;
      message = smartReplace(message, 'taux_reussite', tauxEcl.toFixed(1) + '%');
      message = smartReplace(message, 'taux_eclosion', tauxEcl.toFixed(1));
    }
  }

  // 4. Financial Fallbacks (if not in extra)
  if (transactions && couvaison) {
    const totalDue = (couvaison.nombreOeufs || 0) * (couvaison.prixUnitaire || 0);
    const rest = resteLot(transactions, couvaison.id, totalDue);
    
    // On calcule l'acompte total (somme des encaissements sur ce lot)
    const paid = transactions
      .filter(t => t.typeTransaction === 'Encaissement' && (t.typeVente === 'LO' || t.penseBete?.includes(couvaison.id)))
      .reduce((sum, t) => sum + (t.montantTotal || 0), 0);

    message = smartReplace(message, 'montant_total', totalDue.toLocaleString());
    message = smartReplace(message, 'reste_a_payer', rest.toLocaleString());
    message = smartReplace(message, 'acompte', paid.toLocaleString());
  }

  // 5. Hard safety defaults for critical numerical variables
  // If they are still in the message, replace with '0'
  const finalFallbacks = ['acompte', 'reste_a_payer', 'montant_total', 'quantite', 'viables', 'poussins', 'clairs', 'pourris'];
  finalFallbacks.forEach(key => {
    message = smartReplace(message, key, '0');
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
