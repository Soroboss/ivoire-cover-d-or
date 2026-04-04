-- Migration: Update Client Financial Summary View
-- Description: Detailed unified financial logic including 'verse_jour' and raw balance components.

CREATE OR REPLACE VIEW client_financial_summary AS
WITH client_total_du AS (
    SELECT 
        client_id,
        SUM(nombre_oeufs * prix_unitaire) as total_du
    FROM couvaisons
    WHERE statut != 'Annulé'
    GROUP BY client_id
),
client_transactions_summary AS (
    SELECT 
        client_id,
        SUM(CASE WHEN type_transaction = 'Avoir' THEN montant_total ELSE 0 END) as total_avoir,
        SUM(CASE WHEN type_transaction = 'Remise' THEN montant_total ELSE 0 END) as total_remise,
        SUM(CASE WHEN type_transaction = 'Paiement' THEN montant_total ELSE 0 END) as total_paiement,
        SUM(CASE WHEN type_transaction = 'Deduction' THEN montant_total ELSE 0 END) as total_deduction,
        -- Versé ce jour (UTC date check, client-side might need adjustment but DB is the source of truth)
        SUM(CASE WHEN type_transaction = 'Paiement' AND (date_transaction::timestamptz AT TIME ZONE 'Africa/Abidjan')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Abidjan')::date THEN montant_total ELSE 0 END) as verse_jour
    FROM transactions
    GROUP BY client_id
)
SELECT 
    c.id as client_id,
    c.nom,
    c.telephone,
    c.client_id_ext,
    COALESCE(du.total_du, 0) as total_du,
    COALESCE(tx.total_avoir, 0) as total_avoir,
    COALESCE(tx.total_remise, 0) as total_remise,
    GREATEST(0, COALESCE(tx.total_paiement, 0) - COALESCE(tx.total_deduction, 0)) as net_encaisse,
    -- Reste Total à payer = Total Dû - Avoir - Remise - Net Encaissé
    (
        COALESCE(du.total_du, 0) - 
        COALESCE(tx.total_avoir, 0) - 
        COALESCE(tx.total_remise, 0) - 
        GREATEST(0, COALESCE(tx.total_paiement, 0) - COALESCE(tx.total_deduction, 0))
    ) as reste_a_payer,
    COALESCE(tx.verse_jour, 0) as verse_jour
FROM clients c
LEFT JOIN client_total_du du ON c.id = du.client_id
LEFT JOIN client_transactions_summary tx ON c.id = tx.client_id;
