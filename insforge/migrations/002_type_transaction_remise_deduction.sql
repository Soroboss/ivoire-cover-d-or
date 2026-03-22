-- Exécuter une fois sur la base InsForge (PostgreSQL)
-- Étend l’enum type_transaction pour les remises et déductions sur encaisse

ALTER TYPE type_transaction ADD VALUE IF NOT EXISTS 'Remise';
ALTER TYPE type_transaction ADD VALUE IF NOT EXISTS 'Deduction';
