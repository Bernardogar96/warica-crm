-- ═══════════════════════════════════════════════════════════════════════════
-- Política RLS — Permitir inserts desde Google Forms Webhook
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Contexto:
--   El webhook de Google Forms (google-forms-webhook.js) se conecta a
--   Supabase usando la anon key. Por default, RLS bloquea cualquier INSERT
--   desde anon, así que creamos una política que SOLO permite insertar
--   filas donde data->>'source' = 'google_forms' y el stage sea 'Backlog'.
--
--   Esto limita el riesgo: aunque alguien tenga el anon key, solo podría
--   crear leads en Backlog marcados como provenientes de google_forms.
--   No puede crear deals en etapas avanzadas ni suplantar otras fuentes.
--
-- Cómo aplicar:
--   Supabase Dashboard → SQL Editor → New query → pega este archivo → Run
--
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Asegurar que RLS está activa en la tabla (no la apagues nunca)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 2. Quitar la política si ya existía (para poder re-ejecutar sin error)
DROP POLICY IF EXISTS "Allow anon insert from google_forms" ON public.opportunities;

-- 3. Crear la política que permite SOLO inserts con source = google_forms
CREATE POLICY "Allow anon insert from google_forms"
  ON public.opportunities
  FOR INSERT
  TO anon
  WITH CHECK (
    (data->>'source') = 'google_forms'
    AND (data->>'stage') = 'Backlog'
  );

-- 4. Verificación opcional — debe regresar la política recién creada
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'opportunities'
  AND policyname = 'Allow anon insert from google_forms';
