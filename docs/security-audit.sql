-- =====================================================================
-- docs/security-audit.sql
-- Corre estos queries en Supabase SQL Editor para auditar RLS.
-- Si CUALQUIERA devuelve filas, hay algo que arreglar.
-- =====================================================================

-- 1) Tablas en `public` SIN RLS habilitado (RIESGO ALTO)
SELECT schemaname, tablename
FROM   pg_tables
WHERE  schemaname = 'public'
  AND  rowsecurity = false;

-- 2) Tablas con RLS ON pero SIN policies (= todo bloqueado o totalmente abierto, según conexión)
SELECT c.relname AS tabla
FROM   pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE  c.relkind = 'r'
  AND  c.relnamespace = 'public'::regnamespace
  AND  c.relrowsecurity = true
  AND  p.polname IS NULL;

-- 3) Listar TODAS las policies actuales del schema public
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM   pg_policies
WHERE  schemaname = 'public'
ORDER  BY tablename, policyname;

-- 4) Detectar policies permisivas peligrosas: USING (true) sin discriminar rol
SELECT tablename, policyname, qual
FROM   pg_policies
WHERE  schemaname = 'public'
  AND  qual = 'true'
  AND  cmd IN ('UPDATE','DELETE','INSERT');

-- 5) ¿Hay funciones SECURITY DEFINER sin search_path fijo? (vector típico de escalation)
SELECT n.nspname, p.proname, p.prosecdef, p.proconfig
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  n.nspname = 'public'
  AND  p.prosecdef = true
  AND  ( p.proconfig IS NULL OR NOT EXISTS (
           SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
       ) );

-- 6) Verificación rápida del fix anti-auto-promotion en profiles
-- (Resultado esperado: las dos policies abajo existen)
SELECT policyname, cmd, qual, with_check
FROM   pg_policies
WHERE  schemaname='public' AND tablename='profiles'
ORDER  BY policyname;
