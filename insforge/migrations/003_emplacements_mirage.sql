-- Snapshots tiroirs/casiers pour traçabilité banque & suivi
ALTER TABLE couvaisons ADD COLUMN IF NOT EXISTS emplacements_avant_mirage JSONB;
ALTER TABLE couvaisons ADD COLUMN IF NOT EXISTS emplacements_apres_mirage JSONB;
