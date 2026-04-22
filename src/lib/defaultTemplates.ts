import type { MessageTemplate } from '../types';

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'updatedAt' | 'createdAt'>[] = [
  {
    name: 'Accusé de Réception',
    category: 'RECEPTION',
    content: `📝 *CONFIRMATION DE RÉCEPTION - IVOIRE COUVÉE D'OR* 📝

Cher(e) *{{client_name}}*,

Nous avons le plaisir de vous confirmer la mise en incubation de votre lot :

📅 *Dépôt le* : {{date_reception}}
📦 *Détail des lots* :
{{details_lots}}

📊 *SUIVI FINANCIER* :
- Montant total : {{montant_total}} F
- Acompte versé : {{acompte}} F
🚩 *Reste à régler : {{reste_a_payer}} F*

🕒 *PROCHAINES ÉTAPES* :
🔍 Mirage technique : environ le {{date_mirage}} (vérification de la fertilité).
🐣 Éclosion finale prévue : environ le {{date_eclosion}}.

_Veuillez conserver ce message comme preuve de dépôt. Merci de confier vos projets à l'expertise d'Ivoire Couvée d'Or !_

🆘 Besoin d'aide ? Contactez-nous au : +225 01 03 03 64 62.`,
    isActive: true,
    description: 'Message de bienvenue envoyé lors du dépôt des œufs.'
  },
  {
    name: 'Mise en Machine',
    category: 'MISE_EN_MACHINE',
    content: `⚙️ *CONFIRMATION DE MISE EN MACHINE - IVOIRE COUVÉE D'OR* ⚙️

Bonjour *{{client_name}}*,

Nous vous informons que votre lot a été officiellement mis en machine ce jour. Le processus d'incubation a commencé.

📦 *DÉTAIL DU LOT* :
- 🥚 Type d'œuf : *{{type_oeuf}}*
- 🔢 Quantité en incubation : *{{quantite}}* œufs

📅 *CALENDRIER TECHNIQUE* :
- ⚙️ Date de mise en machine : {{date_mise_en_machine}}
- 🔍 Jour de mirage : {{date_mirage}}
- 🐣 Démarrage éclosion : {{date_eclosion}}

💰 *SITUATION FINANCIÈRE* :
- 💵 Montant total : {{montant_total}} FCFA
- 💳 Acompte versé : {{acompte}} FCFA
- 🚩 *RESTE À PAYER : {{reste_a_payer}} FCFA*

Veuillez prévoir le règlement total pour récupérer vos poussins.

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message envoyé lorsque les œufs sont placés dans la couveuse (Mise en machine).'
  },
  {
    name: 'Bilan du Mirage',
    category: 'MIRAGE',
    content: `🕯️ *RÉSULTATS DU MIRAGE TECHNIQUE* 🕯️

Bonjour *{{client_name}}*,

📊 *STATISTIQUES TECHNIQUES* :
- 🧪 Lot total : {{quantite}} {{type_oeuf}}s
- 💎 Œufs fertiles : *{{fertile}}*
- ⚪ Œufs non-fertiles (clairs) : {{clairs}}
- ⚠️ Œufs pourris/écartés : {{pourris}}

📅 *CALENDRIER TECHNIQUE* :
- 📥 Date de dépôt : {{date_reception}}
- 🔍 Mirage effectué : {{date_mirage}}
- 🐣 Éclosion prévue : {{date_eclosion}}

💰 *SITUATION FINANCIÈRE* :
- 💵 Montant total : {{montant_total}} FCFA
- 💳 Acompte versé : {{acompte}} FCFA
- 🚩 *RESTE À PAYER : {{reste_a_payer}} FCFA*

Veuillez prévoir le règlement total pour récupérer vos poussins.

✅ *PROCHAINE ÉTAPE* : Vos {{fertile}} œufs fertiles poursuivent leur développement vers l'éclosion.

_Nous restons mobilisés pour vous garantir le meilleur taux de réussite._

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Bilan envoyé après le mirage (souvent J+14).'
  },
  {
    name: 'Bilan du 2ème Mirage',
    category: 'MIRAGE',
    content: `🕯️ *RÉSULTATS DU 2ÈME MIRAGE TECHNIQUE* 🕯️

Bonjour *{{client_name}}*,

Nous avons effectué un second contrôle de viabilité sur votre lot :

📊 *SITUATION TECHNIQUE ACTUALISÉE* :
- 🧪 Lot total : {{quantite}} {{type_oeuf}}s
- 💎 Œufs fertiles restants : *{{fertile}}*
- ⚠️ Nouveaux écarts détectés : {{pourris}}

📅 *CALENDRIER TECHNIQUE* :
- 📥 Date de dépôt : {{date_reception}}
- 🐣 Éclosion prévue : {{date_eclosion}}

💰 *SITUATION FINANCIÈRE* :
- 💵 Montant total : {{montant_total}} FCFA
- 💳 Acompte : {{acompte}} FCFA
- 🚩 *RESTE À PAYER : {{reste_a_payer}} FCFA*

Veuillez prévoir le règlement total pour récupérer vos poussins.

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Bilan envoyé lors d\'un second contrôle (souvent J+18).'
  },
  {
    name: 'Démarrage Éclosion',
    category: 'ECLOSION',
    content: `🚀 *DÉMARRAGE DE L'ÉCLOSION - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*,

🐣 Votre éclosion pour le Lot de *{{quantite}}* œufs de *{{type_oeuf}}s* a démarré, préparez-vous à venir récupérer vos poussins demain dans l'après-midi.

📅 *CALENDRIER TECHNIQUE* :
• 📥 Date de dépôt : {{date_reception}}
• 🔍 Jour de mirage : {{date_mirage}}
• 🐣 Démarrage éclosion : {{date_eclosion}}

📊 *INFOS TECHNIQUES* :
•  🧪 Lot : {{quantite}} {{type_oeuf}}s
•  ✅ Œufs viables en éclosion : *{{viables}}*
•  🏷️ Identifiant : {{nom_depart}}

💰 *SITUATION FINANCIÈRE* :
•  Reste à payer (ce lot) : {{reste_a_payer}}
🚩 *TOTAL GLOBAL À RÉGLER : {{total_global}}*

{{instruction_paiement}}

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message envoyé lors du transfert des œufs vers les paniers d\'éclosion.'
  },
  {
    name: 'Bilan Sortie Éclosion',
    category: 'FINANCE',
    content: `🐣 *BILAN FINAL D'ÉCLOSION — FÉLICITATIONS !* 🐣

Cher(e) *{{client_name}}*,

Votre lot (ID: {{couvaison_id}}) est prêt ! Voici les résultats définitifs de votre passage chez Ivoire Couvée d'Or :

📈 *RÉSULTATS DE PRODUCTION* :
- 🌱 Œufs mis en machine : {{quantite}} {{type_oeuf}}s
- ✨ Poussins nés viables : *{{poussins}}*
- 🌟 Taux de réussite : *{{taux_eclosion}}%*

💵 *RÉCAPITULATIF FINANCIER* :
- Total Prestation : {{montant_total}} F
- Acompte reçu : {{acompte}} F
- 🚩 *NET À PAYER : {{reste_a_payer}} F*

📦 *RÉCUPÉRATION* : Merci de passer récupérer vos poussins dès que possible cet après-midi. Le règlement total du solde est exigé pour la remise du lot.

{{instruction_paiement}}

_Merci de votre confiance. Pour toute assistance technique post-éclosion, notre équipe est à votre disposition._

L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Bilan de sortie final avec statistiques et solde financier.'
  }
];
