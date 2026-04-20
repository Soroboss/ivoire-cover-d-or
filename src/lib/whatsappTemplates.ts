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
  message = message.replace(/{{client_name}}/g, client.nom);

  // Couvaison info
  if (couvaison) {
    if (couvaison.nombreOeufs !== undefined) {
      message = message.replace(/{{quantite}}/g, (couvaison.nombreOeufs || 0).toString());
    }
    if (couvaison.typeOeuf) {
      message = message.replace(/{{type_oeuf}}/g, couvaison.typeOeuf);
    }
    if (couvaison.dateReception) {
      try {
        message = message.replace(/{{date_reception}}/g, format(parseISO(couvaison.dateReception), 'dd/MM/yyyy'));
      } catch (e) {
        // Fallback if date is invalid
        message = message.replace(/{{date_reception}}/g, couvaison.dateReception);
      }
    }
    
    if (couvaison.dateMiragePrevue) {
      try {
        message = message.replace(/{{date_mirage}}/g, format(parseISO(couvaison.dateMiragePrevue), 'dd/MM/yyyy'));
      } catch (e) {}
    }
    if (couvaison.dateEclosionPrevue) {
      try {
        message = message.replace(/{{date_eclosion}}/g, format(parseISO(couvaison.dateEclosionPrevue), 'dd/MM/yyyy'));
      } catch (e) {}
    }

    // Financials
    if (transactions && couvaison.prixUnitaire !== undefined) {
      const totalDue = couvaison.nombreOeufs * couvaison.prixUnitaire;
      const rest = resteLot(transactions, couvaison.id, totalDue);
      message = message.replace(/{{montant_total}}/g, totalDue.toLocaleString() + ' F');
      message = message.replace(/{{reste_a_payer}}/g, rest.toLocaleString() + ' F');
    }

    // Technical results
    if (couvaison.oeufsClairs !== undefined || couvaison.oeufsPourris !== undefined) {
      const viables = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
      const taux = (couvaison.nombreOeufs || 0) > 0 ? (viables / couvaison.nombreOeufs) * 100 : 0;
      message = message.replace(/{{taux_fecondite}}/g, taux.toFixed(1) + '%');
    }

    if (couvaison.poussinsNes !== undefined) {
      const oeufsRestants = (couvaison.nombreOeufs || 0) - (couvaison.oeufsClairs || 0) - (couvaison.oeufsPourris || 0);
      const taux = oeufsRestants > 0 ? (couvaison.poussinsNes / oeufsRestants) * 100 : 0;
      message = message.replace(/{{taux_reussite}}/g, taux.toFixed(1) + '%');
      message = message.replace(/{{poussins_nes}}/g, couvaison.poussinsNes.toString());
    }
  }

  // Extra variables (poussins_nes, delta_nes, etc. passed manually)
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, value.toString());
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
