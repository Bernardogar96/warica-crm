-- =====================================================================
-- 20260517000000_enable_rls_all_tables.sql
-- Fase 0 — Habilitar RLS en TODAS las tablas críticas.
-- Esta migración es idempotente (DROP POLICY IF EXISTS + CREATE POLICY).
-- =====================================================================

-- ----- Helper: función para checar rol del caller sin loops infinitos -----
-- (security definer + lockdown del search_path para evitar el typical bug)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.current_user_role() = 'admin' $$;

CREATE OR REPLACE FUNCTION public.is_role(_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.current_user_role() = ANY (_roles) $$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.is_role(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_role(text[]) TO authenticated;

-- =====================================================================
-- PROFILES (la más crítica — fix auto-promoción a admin)
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self_safe ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;

-- SELECT: cada quien su propio profile + admins ven todos
CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING ( id = auth.uid() OR public.is_admin() );

-- INSERT: solo el propio usuario (típicamente lo hace el trigger handle_new_user)
CREATE POLICY profiles_insert_self ON public.profiles
FOR INSERT TO authenticated
WITH CHECK ( id = auth.uid() );

-- UPDATE (self): puede tocar `name` pero NO role/active/email
CREATE POLICY profiles_update_self_safe ON public.profiles
FOR UPDATE TO authenticated
USING ( id = auth.uid() )
WITH CHECK (
  id = auth.uid()
  AND role   IS NOT DISTINCT FROM (SELECT role   FROM public.profiles WHERE id = auth.uid())
  AND active IS NOT DISTINCT FROM (SELECT active FROM public.profiles WHERE id = auth.uid())
  AND email  IS NOT DISTINCT FROM (SELECT email  FROM public.profiles WHERE id = auth.uid())
);

-- UPDATE (admin): puede tocar lo que sea
CREATE POLICY profiles_update_admin ON public.profiles
FOR UPDATE TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- DELETE: solo admin (y no a sí mismo)
CREATE POLICY profiles_delete_admin ON public.profiles
FOR DELETE TO authenticated
USING ( public.is_admin() AND id <> auth.uid() );

-- =====================================================================
-- CRM_CONFIG (lectura libre autenticado, escritura admin)
-- =====================================================================
ALTER TABLE public.crm_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_config_select_auth ON public.crm_config;
DROP POLICY IF EXISTS crm_config_write_admin ON public.crm_config;

CREATE POLICY crm_config_select_auth ON public.crm_config
FOR SELECT TO authenticated USING ( true );

CREATE POLICY crm_config_write_admin ON public.crm_config
FOR ALL TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- =====================================================================
-- CLIENTS, OPPORTUNITIES, PROJECTS (CRM/Ventas)
-- Cualquier usuario autenticado puede leer y escribir registros de
-- negocio. Admin puede borrar.
-- =====================================================================
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_insert ON public.clients;
DROP POLICY IF EXISTS clients_update ON public.clients;
DROP POLICY IF EXISTS clients_delete ON public.clients;
CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY clients_insert ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY clients_update ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY clients_delete ON public.clients FOR DELETE TO authenticated USING ( public.is_admin() );

DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
DROP POLICY IF EXISTS opportunities_insert ON public.opportunities;
DROP POLICY IF EXISTS opportunities_update ON public.opportunities;
DROP POLICY IF EXISTS opportunities_delete ON public.opportunities;
CREATE POLICY opportunities_select ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY opportunities_insert ON public.opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY opportunities_update ON public.opportunities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY opportunities_delete ON public.opportunities FOR DELETE TO authenticated USING ( public.is_admin() );

DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY projects_insert ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY projects_update ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY projects_delete ON public.projects FOR DELETE TO authenticated USING ( public.is_admin() );

-- =====================================================================
-- INVOICES (sensibles — facturación CFDI)
-- =====================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select ON public.invoices;
DROP POLICY IF EXISTS invoices_insert ON public.invoices;
DROP POLICY IF EXISTS invoices_update ON public.invoices;
DROP POLICY IF EXISTS invoices_delete ON public.invoices;
CREATE POLICY invoices_select ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY invoices_insert ON public.invoices FOR INSERT TO authenticated WITH CHECK ( public.is_role(ARRAY['admin','ventas','contabilidad']) );
CREATE POLICY invoices_update ON public.invoices FOR UPDATE TO authenticated
  USING ( public.is_role(ARRAY['admin','ventas','contabilidad']) )
  WITH CHECK ( public.is_role(ARRAY['admin','ventas','contabilidad']) );
CREATE POLICY invoices_delete ON public.invoices FOR DELETE TO authenticated USING ( public.is_admin() );

-- =====================================================================
-- NÓMINA (PII: CURP, RFC, NSS, CLABE, salarios) — solo admin + rh
-- =====================================================================
ALTER TABLE public.employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employees_rh_select ON public.employees;
DROP POLICY IF EXISTS employees_rh_modify ON public.employees;
CREATE POLICY employees_rh_select ON public.employees
FOR SELECT TO authenticated USING ( public.is_role(ARRAY['admin','rh']) );
CREATE POLICY employees_rh_modify ON public.employees
FOR ALL TO authenticated
USING ( public.is_role(ARRAY['admin','rh']) )
WITH CHECK ( public.is_role(ARRAY['admin','rh']) );

DROP POLICY IF EXISTS payroll_periods_rh ON public.payroll_periods;
CREATE POLICY payroll_periods_rh ON public.payroll_periods
FOR ALL TO authenticated
USING ( public.is_role(ARRAY['admin','rh']) )
WITH CHECK ( public.is_role(ARRAY['admin','rh']) );

DROP POLICY IF EXISTS payroll_entries_rh ON public.payroll_entries;
CREATE POLICY payroll_entries_rh ON public.payroll_entries
FOR ALL TO authenticated
USING ( public.is_role(ARRAY['admin','rh']) )
WITH CHECK ( public.is_role(ARRAY['admin','rh']) );

-- =====================================================================
-- COMPRAS (suppliers, purchase_*)
-- =====================================================================
ALTER TABLE public.suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_quotes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_select ON public.suppliers;
DROP POLICY IF EXISTS suppliers_modify ON public.suppliers;
CREATE POLICY suppliers_select ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY suppliers_modify ON public.suppliers FOR ALL TO authenticated
  USING ( public.is_role(ARRAY['admin','compras']) )
  WITH CHECK ( public.is_role(ARRAY['admin','compras']) );

DROP POLICY IF EXISTS purchase_requests_select ON public.purchase_requests;
DROP POLICY IF EXISTS purchase_requests_insert ON public.purchase_requests;
DROP POLICY IF EXISTS purchase_requests_update ON public.purchase_requests;
DROP POLICY IF EXISTS purchase_requests_delete ON public.purchase_requests;
CREATE POLICY purchase_requests_select ON public.purchase_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_requests_insert ON public.purchase_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_requests_update ON public.purchase_requests FOR UPDATE TO authenticated
  USING ( public.is_role(ARRAY['admin','compras']) )
  WITH CHECK ( public.is_role(ARRAY['admin','compras']) );
CREATE POLICY purchase_requests_delete ON public.purchase_requests FOR DELETE TO authenticated USING ( public.is_admin() );

DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_modify ON public.purchase_quotes;
CREATE POLICY purchase_quotes_select ON public.purchase_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_modify ON public.purchase_quotes FOR ALL TO authenticated
  USING ( public.is_role(ARRAY['admin','compras']) )
  WITH CHECK ( public.is_role(ARRAY['admin','compras']) );

DROP POLICY IF EXISTS purchase_orders_select ON public.purchase_orders;
DROP POLICY IF EXISTS purchase_orders_modify ON public.purchase_orders;
CREATE POLICY purchase_orders_select ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_orders_modify ON public.purchase_orders FOR ALL TO authenticated
  USING ( public.is_role(ARRAY['admin','compras']) )
  WITH CHECK ( public.is_role(ARRAY['admin','compras']) );

-- =====================================================================
-- VERIFICACIÓN (corre estos selects después y revisa que NO devuelven nada)
-- =====================================================================
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;
-- SELECT c.relname FROM pg_class c LEFT JOIN pg_policy p ON p.polrelid=c.oid
--   WHERE c.relkind='r' AND c.relnamespace='public'::regnamespace AND c.relrowsecurity
--   AND p.polname IS NULL;
