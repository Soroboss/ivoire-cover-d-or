-- Ajout de la colonne description aux templates WhatsApp (si elle n'existe pas déjà)
ALTER TABLE message_templates
  ADD COLUMN IF NOT EXISTS description TEXT;
