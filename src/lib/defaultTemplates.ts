import type { MessageTemplate } from '../types';

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'updatedAt' | 'createdAt'>[] = [
   {
    name: 'Accusé de Réception',
    category: 'RECEPTION',
    content: `◈ *CONFIRMATION DE RÉCEPTION - IVOIRE COUVÉE D'OR*

Cher(e) *{{client_name}}*, nous vous confirmons la mise en incubation de votre lot :

◈ *Date de dépôt* : {{date_reception}}
◈ *Détail des lots* :
{{details_lots}}

◈ *SUIVI FINANCIER* :
◈ Montant total : {{montant_total}} F
◈ Acompte versé : {{acompte}} F
◈ *RESTE À RÉGLER : {{reste_a_payer}} F*

◈ *PROCHAINES ÉTAPES* :
◈ Mirage technique : env. le {{date_mirage}}
◈ Éclosion finale : env. le {{date_eclosion}}

_Merci de confier vos projets à l'expertise d'Ivoire Couvée d'Or !_
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message de bienvenue envoyé lors du dépôt des œufs.'
  },
  {
    name: 'Mise en Machine',
    category: 'MISE_EN_MACHINE',
    content: `◈ *CONFIRMATION DE MISE EN MACHINE - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*, votre lot a été officiellement mis en machine.

◈ *DÉTAIL DU LOT* :
◈ Type d'œuf : *{{type_oeuf}}*
◈ Quantité : *{{quantite}}* œufs

◈ *CALENDRIER TECHNIQUE* :
◈ Date de mise en machine : {{date_mise_en_machine}}
◈ Jour de mirage : {{date_mirage}}
◈ Démarrage éclosion : {{date_eclosion}}

◈ *SITUATION FINANCIÈRE* :
◈ Montant total : {{montant_total}} F
◈ Acompte versé : {{acompte}} F
◈ *RESTE À PAYER : {{reste_a_payer}} F*

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message envoyé lorsque les œufs sont placés dans la couveuse (Mise en machine).'
  },
  {
    name: 'Bilan du Mirage',
    category: 'MIRAGE',
    content: `◈ *RÉSULTATS DU MIRAGE TECHNIQUE - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*, le contrôle de fécondité de votre lot a été effectué :

◈ *STATISTIQUES TECHNIQUES* :
◈ Lot total : {{quantite}} {{type_oeuf}}s
◈ Œufs fertiles : *{{fertile}}*
◈ Œufs clairs : {{clairs}}
◈ Œufs pourris : {{pourris}}

◈ *CALENDRIER TECHNIQUE* :
◈ Dépôt : {{date_reception}}
◈ Mirage : {{date_mirage}}
◈ Éclosion : {{date_eclosion}}

◈ *SITUATION FINANCIÈRE* :
◈ Reste à payer (ce lot) : {{reste_a_payer}} F
◈ *TOTAL GLOBAL À RÉGLER : {{total_global}} F*

✅ Vos {{fertile}} œufs fertiles poursuivent leur développement.
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Bilan envoyé après le mirage (souvent J+14).'
  },
  {
    name: 'Bilan du 2ème Mirage',
    category: 'MIRAGE',
    content: `◈ *RÉSULTATS DU 2ÈME MIRAGE TECHNIQUE*

Bonjour *{{client_name}}*, contrôle de viabilité actualisé :

◈ *SITUATION TECHNIQUE* :
◈ Lot total : {{quantite}} {{type_oeuf}}s
◈ Œufs fertiles restants : *{{fertile}}*
◈ Nouveaux écarts : {{pourris}}

◈ *CALENDRIER TECHNIQUE* :
◈ Éclosion prévue : {{date_eclosion}}

◈ *SITUATION FINANCIÈRE* :
◈ *RESTE TOTAL À PAYER : {{total_global}} F*

Merci de votre confiance !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Bilan envoyé lors d\'un second contrôle (souvent J+18).'
  },
  {
    name: 'Démarrage Éclosion',
    category: 'ECLOSION',
    content: `◈ *DÉMARRAGE DE L'ÉCLOSION - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*, votre éclosion pour le Lot de *{{quantite}}* œufs de *{{type_oeuf}}s* a démarré.

◈ *CALENDRIER TECHNIQUE* :
◈ Date de dépôt : {{date_reception}}
◈ Mirage : {{date_mirage}}
◈ Démarrage éclosion : {{date_eclosion}}

◈ *INFOS TECHNIQUES* :
◈ Lot : {{quantite}} {{type_oeuf}}s
◈ Œufs viables en éclosion : *{{viables}}*
◈ Identifiant : {{nom_depart}}

◈ *SITUATION FINANCIÈRE* :
◈ Reste à payer (ce lot) : {{reste_a_payer}} F
◈ *TOTAL GLOBAL À RÉGLER : {{total_global}} F*

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
    content: `◈ *SITUATION FINANCIÈRE - IVOIRE COUVÉE D'OR*

◈ Client: *{{client_name}}* ({{client_id_ext}})
◈ Lot: *{{quantite}} {{type_oeuf}}*
◈ Date de dépôt : {{date_reception}}
◈ Éclosion : *{{delta_nes}}* nouveaux poussins (Total: *{{ratio_eclosion}}*)

◈ *DÉTAIL DU RÈGLEMENT* :
◈ Montant Total dû: {{montant_du}} F
◈ Remise: {{remise}}
◈ Avoir: {{avoir}}
◈ Net encaissé: {{net_encaisse}} F

◈ *RESTE TOTAL À PAYER : {{total_global}} F*

◈ Passage prévu : demain après-midi pour la récupération.

Merci de votre confiance !
L'équipe expertise Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Bilan de sortie final avec statistiques et solde financier détaillé.'
  },
  {
    name: 'Rappel de Collecte',
    category: 'ECLOSION',
    content: `◈ *RAPPEL DE RÉCUPÉRATION - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*,

◈ Vos poussins pour le lot *{{type_oeuf}}s* sont prêts !
◈ Nous vous attendons cet après-midi pour la récupération de votre lot.

◈ *RESTE À RÉGLER : {{total_global}} F*

Merci de prévoir des caisses de transport adaptées.
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message de rappel envoyé le jour J de la récupération.'
  },
  {
    name: 'Conseils Post-Éclosion',
    category: 'SUIVI',
    content: `◈ *SUIVI & CONSEILS - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*, comment se portent vos nouveaux poussins ?

Voici quelques rappels pour assurer leur survie :
◈ *CHALEUR* : Maintenez une température stable (env. 32-35°C) sous l'éleveuse.
◈ *EAU* : De l'eau propre et tiède disponible en permanence avec de l'anti-stress.
◈ *ALIMENT* : Utilisez un aliment "Démarrage" de qualité dès les premières heures.

◈ Nous restons à votre écoute pour tout conseil technique !
L'équipe expertise Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message de suivi envoyé 24-48h après la récupération.'
  },
  {
    name: 'Quittance de Paiement',
    category: 'FINANCE',
    content: `◈ *CONFIRMATION DE RÈGLEMENT - IVOIRE COUVÉE D'OR*

Cher(e) *{{client_name}}*,

◈ Nous confirmons avoir reçu votre règlement de *{{montant_paye}} F*.
◈ Votre lot (ID: {{couvaison_id}}) est désormais entièrement soldé.

Merci de votre confiance et à très bientôt pour vos prochains lots !
L'équipe Ivoire Couvée d'Or.
📞 Service client : +225 01 03 03 64 62`,
    isActive: true,
    description: 'Message envoyé après le paiement du solde final.'
  },
  {
    name: 'Alerte Incident Technique',
    category: 'ALERTE',
    content: `◈ *ALERTE TECHNIQUE - IVOIRE COUVÉE D'OR*

Bonjour *{{client_name}}*,

◈ Nous vous informons d'une instabilité technique (coupure courant ou machine) survenue ce jour.
◈ Nos techniciens interviennent pour stabiliser la situation.
◈ Nous suivons l'impact potentiel sur votre lot *{{type_oeuf}}s* et vous tiendrons informé de l'évolution.

Merci de votre compréhension.
L'équipe technique Ivoire Couvée d'Or.`,
    isActive: true,
    description: 'Message d\'alerte en cas de problème technique majeur.'
  }
];
