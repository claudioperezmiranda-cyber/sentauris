ALTER TABLE licitaciones
  ADD COLUMN IF NOT EXISTS garantia_preventiva_meses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS garantia_correctiva_meses INTEGER DEFAULT 0;
