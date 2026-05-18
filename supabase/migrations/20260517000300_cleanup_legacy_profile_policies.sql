-- =====================================================================
-- 20260517000300_cleanup_legacy_profile_policies.sql
-- Quita policies viejas en `profiles` que estaban creando huecos de
-- seguridad. Postgres combina policies con OR: basta UNA permisiva sin
-- WITH CHECK para anular el fix anti-auto-promoción.
-- =====================================================================

-- ── Huecos de auto-promoción a admin (UPDATE sin WITH CHECK) ───────
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "self_update" ON public.profiles;

-- ── Hueco de privacidad: cualquier auth user lee todos los profiles ─
DROP POLICY IF EXISTS "read_profiles" ON public.profiles;

-- ── Redundantes con nuestras policies nuevas ───────────────────────
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;

-- Nota: dejamos "Service role can manage all profiles" — apunta al
-- service_role que bypasea RLS de todas formas. No es riesgo.

-- ── Verificación post-cleanup ──────────────────────────────────────
-- Después de aplicar esto, el SELECT en pg_policies para profiles debe
-- mostrar exactamente:
--   - "Service role can manage all profiles" (ALL, target=service_role)
--   - profiles_select          (SELECT)
--   - profiles_insert_self     (INSERT)
--   - profiles_update_self_safe (UPDATE, WITH CHECK que bloquea role/active/email)
--   - profiles_update_admin    (UPDATE, solo admin)
--   - profiles_delete_admin    (DELETE, solo admin, no a sí mismo)
