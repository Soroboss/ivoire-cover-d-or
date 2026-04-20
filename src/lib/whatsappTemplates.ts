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
  let message = template.content;
  const { client, couvaison, transactions, extra } = data;

  // Basic client info
  message = message.split('{{client_name}}').join(client.nom || '');

  // Couvaison info
  if (couvaison) {
    if (couvaison.nombreOeufs !== undefined) {
      message = message.split('{{quantite}}').join((couvaison.nombreOeufs || 0).toString());
    }
    if (couvaison.typeOeuf) {
      message = message.split('{{type_oeuf}}').join(couvaison.typeOeuf);
    }
    if (couvaison.dateReception) {
      try {
        message = message.split('{{date_reception}}').join(format(parseISO(couvaison.dateReception), 'dd/MM/yyyy'));
      } catch (e) {
        // Fallback if date is invalid
        message = message.split('{{date_reception}}').join(couvaison.dateReception);
      }
    }
    
    if (couvaison.dateMiragePrevue) {
      try {
        message = message.split('{{date_mirage}}').join(format(parseISO(couvaison.dateMiragePrevue), 'dd/MM/yyyy'));
      } catch (e) {}
    }
    if (couvaison.dateEclosionPrevue) {
      try {
        message = message.split('{{date_eclosion}}').join(format(parseISO(couvaison.dateEclosionPrevue), 'dd/MM/yyyy'));
      } catch (e) {}
    }

    // Financials
    if (transactions && couvaison.prixUnitaire !== undefined) {
      const totalDue = couvaison.nombreOeufs * couvaison.prixUnitaire;
      const rest = resteLot(transactions, couvaison.id, totalDue);
      message = message.split('{{montant_total}}').join(totalDue.toLocaleString() + ' F');
      message = message.split('{{reste_a_payer}}').join(rest.toLocaleString() + ' F');
    }

    // Technical results
    if (couvaison.oeufsClairs !== undefined || couvaison.oeufsPourris !== undefined) {
      const viables = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
      const taux = (couvaison.nombreOeufs || 0) > 0 ? (viables / (couvaison.nombreOeufs || 1)) * 100 : 0;
      message = message.split('{{taux_fecondite}}').join(taux.toFixed(1) + '%');
    }

    if (couvaison.poussinsNes !== undefined) {
      const oeufsRestants = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
      const taux = (oeufsRestants || 0) > 0 ? (couvaison.poussinsNes / (oeufsRestants || 1)) * 100 : 0;
      message = message.split('{{taux_reussite}}').join(taux.toFixed(1) + '%');
      message = message.split('{{poussins_nes}}').join(couvaison.poussinsNes.toString());
    }
  }

  // Extra variables (poussins_nes, delta_nes, etc. passed manually)
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      const search = `{{${key}}}`;
      // Use split/join for safe replacement of all occurrences without regex escaping issues
      message = message.split(search).join((value ?? '').toString());
    });
  }

  return message;
};

export const normalizePhoneForWhatsApp = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned.substring(1);
  if (cleaned.length === 10) return '225' + cleaned;
  return cleaned;
};
