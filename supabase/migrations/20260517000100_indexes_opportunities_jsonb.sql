-- =====================================================================
-- 20260517000100_indexes_opportunities_jsonb.sql
-- Fase 6 — Índices funcionales para opportunities.data (jsonb).
-- =====================================================================

-- Filtros por etapa/vendedor son los más comunes en kanban + dashboard.
CREATE INDEX IF NOT EXISTS idx_opp_stage
  ON public.opportunities ((data->>'stage'));

CREATE INDEX IF NOT EXISTS idx_opp_salesperson
  ON public.opportunities ((data->>'salesperson'));

CREATE INDEX IF NOT EXISTS idx_opp_business_unit
  ON public.opportunities ((data->>'businessUnit'));

CREATE INDEX IF NOT EXISTS idx_opp_status
  ON public.opportunities ((data->>'status'));

-- GIN para búsquedas sobre el blob completo (autocomplete, fuzzy search).
CREATE INDEX IF NOT EXISTS idx_opp_data_gin
  ON public.opportunities USING gin (data jsonb_path_ops);

-- Created_at suele ordenarse desc en listados.
CREATE INDEX IF NOT EXISTS idx_opp_created_at
  ON public.opportunities (((data->>'createdAt')::timestamptz) DESC);

-- Projects: filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_projects_opp     ON public.projects (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_projects_client  ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON public.projects (status);

-- Invoices / payroll buscan por su FK
CREATE INDEX IF NOT EXISTS idx_invoices_project ON public.invoices (project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client  ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON public.invoices (status);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_period ON public.payroll_entries (period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_emp    ON public.payroll_entries (employee_id);

-- Purchase chain
CREATE INDEX IF NOT EXISTS idx_pq_request   ON public.purchase_quotes (request_id);
CREATE INDEX IF NOT EXISTS idx_po_request   ON public.purchase_orders (request_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier  ON public.purchase_orders (supplier_id);
