-- Agrega columnas extendidas a la tabla clientes para persistir direccion, comuna y otros campos del formulario.
-- Ejecutar en el SQL Editor de Supabase.

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion_principal text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS comuna             text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ciudad             text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS region             text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pais               text DEFAULT 'Chile';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono           text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS giro               text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nombre_fantasia    text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_cliente       text DEFAULT 'No';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_proveedor     text DEFAULT 'No';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cliente_proveedor_critico text DEFAULT 'No';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS correo_sii         text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS correo_comercial   text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS plazo_pago         text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS sucursales         jsonb DEFAULT '[]'::jsonb;
