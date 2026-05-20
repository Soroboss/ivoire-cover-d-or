CREATE OR REPLACE VIEW client_financial_summary AS
WITH client_total_du AS (
    SELECT couvaisons.client_id,
        sum((couvaisons.nombre_oeufs * couvaisons.prix_unitaire)) AS total_du
    FROM couvaisons
    WHERE (couvaisons.statut <> 'Annulé'::statut_couvaison)
    GROUP BY couvaisons.client_id
), client_transactions_summary AS (
    SELECT transactions.client_id,
        sum(
            CASE
                WHEN (transactions.type_transaction = 'Avoir'::type_transaction) THEN transactions.montant_total
                ELSE (0)::numeric
            END) AS total_avoir,
        sum(
            CASE
                WHEN (transactions.type_transaction = 'Remise'::type_transaction) THEN transactions.montant_total
                ELSE (0)::numeric
            END) AS total_remise,
        sum(
            CASE
                WHEN (transactions.type_transaction = 'Paiement'::type_transaction) THEN transactions.montant_total
                ELSE (0)::numeric
            END) AS total_paiement,
        sum(
            CASE
                WHEN (transactions.type_transaction = 'Deduction'::type_transaction) THEN transactions.montant_total
                ELSE (0)::numeric
            END) AS total_deduction,
        sum(
            CASE
                WHEN (transactions.type_transaction = 'Dette'::type_transaction) THEN transactions.montant_total
                ELSE (0)::numeric
            END) AS total_dette,
        sum(
            CASE
                WHEN ((transactions.type_transaction = 'Paiement'::type_transaction) AND (date((transactions.date_transaction AT TIME ZONE 'Africa/Abidjan'::text)) = CURRENT_DATE)) THEN transactions.montant_total
                ELSE (0)::numeric
            END) AS verse_jour
    FROM transactions
    GROUP BY transactions.client_id
)
SELECT c.id AS client_id,
    c.nom,
    c.telephone,
    c.client_id_ext,
    COALESCE(du.total_du, (0)::bigint) AS total_du,
    COALESCE(tx.total_avoir, (0)::numeric) AS total_avoir,
    COALESCE(tx.total_remise, (0)::numeric) AS total_remise,
    COALESCE(tx.total_dette, (0)::numeric) AS total_dette,
    GREATEST((0)::numeric, (COALESCE(tx.total_paiement, (0)::numeric) - COALESCE(tx.total_deduction, (0)::numeric))) AS net_encaisse,
    GREATEST((0)::numeric, (
        (((COALESCE(du.total_du, (0)::bigint))::numeric + COALESCE(tx.total_dette, (0)::numeric)) - COALESCE(tx.total_avoir, (0)::numeric)) - COALESCE(tx.total_remise, (0)::numeric)
    ) - GREATEST((0)::numeric, (COALESCE(tx.total_paiement, (0)::numeric) - COALESCE(tx.total_deduction, (0)::numeric)))) AS reste_a_payer,
    GREATEST((0)::numeric, (
        ((GREATEST((0)::numeric, (COALESCE(tx.total_paiement, (0)::numeric) - COALESCE(tx.total_deduction, (0)::numeric))) + COALESCE(tx.total_avoir, (0)::numeric)) + COALESCE(tx.total_remise, (0)::numeric)) - ((COALESCE(du.total_du, (0)::bigint))::numeric + COALESCE(tx.total_dette, (0)::numeric))
    )) AS avoir_client,
    COALESCE(tx.verse_jour, (0)::numeric) AS verse_jour
FROM ((clients c
    LEFT JOIN client_total_du du ON ((c.id = du.client_id)))
    LEFT JOIN client_transactions_summary tx ON ((c.id = tx.client_id)));
