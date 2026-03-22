-- Dépenses / charges d'exploitation (loyer, énergie, salaires, etc.)
-- À exécuter une fois sur la base InsForge (PostgreSQL)

CREATE TABLE IF NOT EXISTS depenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_depense timestamptz NOT NULL DEFAULT now(),
  categorie text NOT NULL,
  libelle text NOT NULL,
  montant numeric(14, 2) NOT NULL CHECK (montant >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses (date_depense DESC);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses (categorie);

COMMENT ON TABLE depenses IS 'Sorties de trésorerie hors flux clients (charges fixes et variables)';
