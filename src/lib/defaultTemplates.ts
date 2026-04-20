import { MessageTemplate } from '../types';

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'updatedAt' | 'createdAt'>[] = [
  {
    name: "Accusé de Réception",
    category: 'RECEPTION',
    description: "Envoyé lors du dépôt des œufs au couvoir.",
    content: `🧾 *ACCUSÉ DE RÉCEPTION - IVOIRE COUVÉE D'OR*

👤 Client : *{{client_name}}*
📅 Date de dépôt : {{date_reception}}

📦 *DÉTAIL DES LOTS* :
{{details_lots}}

💰 *SITUATION FINANCIÈRE* :
- Coût Total : {{montant_total}}
- Acompte versé : {{acompte}}
🚩 *RESTE À PAYER : {{reste_a_payer}}*

🔍 *PROCHAINES ÉTAPES* :
- Mirage technique : J+14
- Éclosion : Selon type d'oeuf

⚠️ *Note* : Veuillez conserver ce message comme preuve de dépôt.

_Merci de votre confiance !_ 
*L'équipe Ivoire Couvée d'Or.*`,
    isActive: true
  },
  {
    name: "Bilan du Mirage",
    category: 'MIRAGE',
    description: "Résultats techniques après 14 jours d'incubation.",
    content: `🕯️ *BILAN DU MIRAGE (TRANSPARENCE)*

👤 Client : *{{client_name}}*
🐣 Lot : *{{quantite}} {{type_oeuf}}s*

📊 *RÉSULTATS TECHNIQUES* :
- ✅ Œufs fertiles (viables) : *{{viables}}*
- ⚪ Œufs clairs (inféconds) : {{clairs}}
- ❌ Œufs pourris / morts : {{pourris}}
- 🧬 Taux de fécondité : *{{taux_fecondite}}*

📅 *Étape suivante* : Éclosion prévue le *{{date_eclosion}}*.

_Merci de votre confiance !_ 
*L'équipe Ivoire Couvée d'Or.*`,
    isActive: true
  },
  {
    name: "Démarrage Éclosion",
    category: 'ECLOSION',
    description: "Transfert des œufs vers les paniers d'éclosion.",
    content: `🚀 *DÉMARRAGE DE L'ÉCLOSION - IVOIRE COUVÉE D'OR*

Bonjour {{client_name}},

🐣 Le transfert de votre lot en paniers d'éclosion a été effectué avec succès.

📊 *INFOS TECHNIQUES* :
- 🧪 Lot : {{quantite}} {{type_oeuf}}s
- ✅ Œufs viables en éclosion : *{{viables}}*
- 🏷️ Identifiant : {{nom_depart}}

📌 *SITUATION FINANCIÈRE* :
- Reste à payer (ce lot) : {{reste_a_payer}}
{{dettes_anterieures}}
🚩 *TOTAL GLOBAL À RÉGLER : {{total_global}}*

📦 *Les premières sorties sont attendues demain.*
_Veuillez prévoir le règlement total pour récupérer vos poussins._

Merci de votre confiance !
*L'équipe Ivoire Couvée d'Or.*`,
    isActive: true
  },
  {
    name: "Bilan Sortie Éclosion",
    category: 'FINANCE',
    description: "Bilan technique et financier final pour la récupération.",
    content: `🧾 *BILAN TECHNIQUE & FINANCIER ÉCLOSION*

👤 Client : *{{client_name}}* ({{client_id_ext}})
🐣 Lot : *{{quantite}} {{type_oeuf}}s*

🔍 *RÉSULTATS TECHNIQUES* :
- ✅ Œufs viables mis en éclosion : {{viables}}
- 🐥 Poussins prêts : *{{poussins_nes}}* (Sortie ce jour : +{{delta_nes}})
- ⚠️ Pertes à l'éclosion : {{morts}}
- 🏆 Taux de réussite : *{{taux_reussite}}*

💰 *SITUATION FINANCIÈRE* :
- Montant Total dû : {{montant_total}}
- Remises/Avoirs : {{remises_avoirs}}
- Déjà encaissé : {{deja_encaisse}}
🚩 *NET À PAYER : {{reste_a_payer}}*

📦 *Venez chercher vos poussins demain après-midi.*
_Prévoyez le solde pour la livraison._

_Merci de votre confiance !_ 
*L'équipe Ivoire Couvée d'Or.*`,
    isActive: true
  }
];
