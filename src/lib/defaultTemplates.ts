import type { MessageTemplate } from '../types';

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'updatedAt' | 'createdAt'>[] = [
  {
    name: 'Accusé de Réception',
    category: 'RECEPTION',
    content: `🌟 *CONFIRMATION DE RÉCEPTION - IVOIRE COUVÉE D'OR* 🌟

Cher(e) *{{client_name}}*,

Nous avons le plaisir de vous confirmer la mise en incubation de votre lot :

📅 *Dépôt le* : {{date_reception}}

📦 *DÉTAIL DES LOTS* :
{{details_lots}}

💰 *SITUATION FINANCIÈRE* :
- Coût Total : {{montant_total}} F
- Acompte versé : {{acompte}} F
🚩 *RESTE À PAYER : {{reste_a_payer}} F*

🔍 *CALENDRIER PRÉVISIONNEL (Cycle Technique)* :
1️⃣ *Mirage technique (J+14)* : prévu le *{{date_mirage}}*
2️⃣ *Éclosion estimée* : prévue le *{{date_eclosion}}*

_Veuillez conserver ce message comme preuve de dépôt. Merci de confier vos projets à l'expertise d'Ivoire Couvée d'Or !_

📞 Besoin d'aide ? Contactez-nous au : +225 07 07 43 14 00`,
    isActive: true,
    description: 'Message de bienvenue envoyé lors du dépôt des œufs.'
  },
  {
    name: 'Bilan du Mirage',
    category: 'MIRAGE',
    content: `🕯️ *RÉSULTATS DU MIRAGE TECHNIQUE* 🕯️

Bonjour *{{client_name}}*,

Nos experts ont terminé l'analyse de fertilité de votre lot mis en incubation le {{date_reception}} :

📊 *STATISTIQUES TECHNIQUES* :
- 🧪 Lot total : {{quantite}} {{type_oeuf}}s
- 💎 Œufs fertiles : *{{fertile}}*
- ⚪ Œufs non-fertiles (clairs) : {{clairs}}
- ⚠️ Œufs pourris/écartés : {{pourris}}

✅ *PROCHAINE ÉTAPE* : Vos {{fertile}} œufs fertiles poursuivent leur développement vers l'éclosion.

_Nous restons mobilisés pour vous garantir le meilleur taux de réussite._

*Ivoire Couvée d'Or — L'innovation au service de votre élevage.*`,
    isActive: true,
    description: 'Bilan envoyé après le mirage (souvent J+14).'
  },
  {
    name: 'Démarrage Éclosion',
    category: 'ECLOSION',
    content: `🚀 *DÉMARRAGE DE L'ÉCLOSION - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*,

🐣 Votre éclosion pour le Lot de *{{quantite}}* œufs de *{{type_oeuf}}s* a démarré, préparez-vous à venir récupérer vos poussins demain dans l'après-midi.

• *Date de dépôt des œufs* : {{date_reception}}

📊 *INFOS TECHNIQUES* :
•  🧪 Lot : {{quantite}} {{type_oeuf}}s
•  ✅ Œufs viables en éclosion : *{{viables}}*
•  🏷️ Identifiant : {{nom_depart}}

💰 *SITUATION FINANCIÈRE* :
•  Reste à payer (ce lot) : {{reste_a_payer}}
🚩 *TOTAL GLOBAL À RÉGLER : {{total_global}}*

{{instruction_paiement}}

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.`,
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
🚩 *NET À PAYER : {{reste_a_payer}} F*

{{instruction_paiement}}

_Merci de votre confiance. Pour toute assistance technique post-éclosion, notre équipe est à votre disposition._

📍 *Ivoire Couvée d'Or* — Excellence & Performance`,
    isActive: true,
    description: 'Bilan de sortie final avec statistiques et solde financier.'
  }
];
