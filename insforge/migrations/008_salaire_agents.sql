-- Salariés / agents : rémunération fixée par l’entrepreneur (base bulletin de paie)
-- À exécuter une fois sur la base InsForge (PostgreSQL)

CREATE TABLE IF NOT EXISTS salaire_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  fonction text,
  matricule text,
  numero_cnps text,
  salaire_mensuel_brut numeric(14, 2) NOT NULL CHECK (salaire_mensuel_brut >= 0),
  primes_defaut numeric(14, 2) NOT NULL DEFAULT 0 CHECK (primes_defaut >= 0),
  autres_gains_defaut numeric(14, 2) NOT NULL DEFAULT 0 CHECK (autres_gains_defaut >= 0),
  retenues_diverses_defaut numeric(14, 2) NOT NULL DEFAULT 0 CHECK (retenues_diverses_defaut >= 0),
  reduction_ricf_defaut numeric(14, 2) NOT NULL DEFAULT 0 CHECK (reduction_ricf_defaut >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salaire_agents_nom ON salaire_agents (nom);

COMMENT ON TABLE salaire_agents IS 'Paramètres de rémunération par salarié pour préremplir les bulletins';
