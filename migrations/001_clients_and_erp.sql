-- ============================================================
-- MIGRACIÓN 001 — Clientes, Nómina, Ventas, Compras
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. Tabla CLIENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name      TEXT NOT NULL,
  legal_name      TEXT,
  industry        TEXT,
  company_size    TEXT,
  website         TEXT,
  social_media    JSONB DEFAULT '{}',
  fiscal_address  JSONB DEFAULT '{}',
  operational_address TEXT,
  phones          TEXT[]  DEFAULT '{}',
  emails          TEXT[]  DEFAULT '{}',
  contacts        JSONB   DEFAULT '[]',
  rfc             TEXT,
  tax_regime      TEXT,
  cfdi_use        TEXT,
  invoice_email   TEXT,
  payment_terms   TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clients_rfc_idx       ON public.clients(rfc);
CREATE INDEX IF NOT EXISTS clients_trade_name_idx ON public.clients(lower(trade_name));

-- ── 2. Agregar client_id a OPPORTUNITIES ──────────────────
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opp_client_id_idx ON public.opportunities(client_id);

-- ── 3. RLS CLIENTS ────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clients' AND policyname='clients_select') THEN
    CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clients' AND policyname='clients_insert') THEN
    CREATE POLICY clients_insert ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clients' AND policyname='clients_update') THEN
    CREATE POLICY clients_update ON public.clients FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clients' AND policyname='clients_delete') THEN
    CREATE POLICY clients_delete ON public.clients FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ── 4. Tabla EMPLOYEES (Nómina) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curp            TEXT UNIQUE,
  rfc             TEXT,
  nss             TEXT,
  full_name       TEXT NOT NULL,
  birth_date      DATE,
  sex             CHAR(1),
  marital_status  TEXT,
  hire_date       DATE NOT NULL,
  contract_type   TEXT NOT NULL DEFAULT 'indeterminado',
  "group"         CHAR(1) NOT NULL DEFAULT 'A' CHECK ("group" IN ('A','B','C')),
  position        TEXT,
  department      TEXT,
  workday_type    TEXT DEFAULT 'completa',
  daily_salary    NUMERIC(12,4) NOT NULL DEFAULT 0,
  sdi             NUMERIC(12,4) NOT NULL DEFAULT 0,
  sbc             NUMERIC(12,4) NOT NULL DEFAULT 0,
  bank            TEXT,
  clabe           TEXT,
  status          TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','baja','suspendido')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='employees' AND policyname='employees_all') THEN
    CREATE POLICY employees_all ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 5. Tabla PAYROLL_CONFIG (parámetros fiscales) ─────────
CREATE TABLE IF NOT EXISTS public.payroll_config (
  id              TEXT PRIMARY KEY DEFAULT 'default',
  year            INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  uma             NUMERIC(12,4) NOT NULL DEFAULT 108.57,
  smg             NUMERIC(12,4) NOT NULL DEFAULT 248.93,
  isr_table       JSONB NOT NULL DEFAULT '[]',
  subsidy_table   JSONB NOT NULL DEFAULT '[]',
  vacation_table  JSONB NOT NULL DEFAULT '[]',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payroll_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payroll_config' AND policyname='payroll_config_all') THEN
    CREATE POLICY payroll_config_all ON public.payroll_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insert default 2025 fiscal parameters
INSERT INTO public.payroll_config (id, year, uma, smg, isr_table, subsidy_table, vacation_table)
VALUES (
  'default', 2025, 108.57, 248.93,
  '[
    {"lowerLimit":0.01,      "upperLimit":746.04,    "fixedFee":0,      "rate":1.92},
    {"lowerLimit":746.05,    "upperLimit":6332.05,   "fixedFee":14.32,  "rate":6.40},
    {"lowerLimit":6332.06,   "upperLimit":11128.01,  "fixedFee":371.83, "rate":10.88},
    {"lowerLimit":11128.02,  "upperLimit":12935.82,  "fixedFee":893.63, "rate":16.00},
    {"lowerLimit":12935.83,  "upperLimit":15487.71,  "fixedFee":1182.88,"rate":17.92},
    {"lowerLimit":15487.72,  "upperLimit":31236.49,  "fixedFee":1640.18,"rate":21.36},
    {"lowerLimit":31236.50,  "upperLimit":49233.00,  "fixedFee":5004.12,"rate":23.52},
    {"lowerLimit":49233.01,  "upperLimit":93993.90,  "fixedFee":9236.89,"rate":30.00},
    {"lowerLimit":93993.91,  "upperLimit":125325.20, "fixedFee":22665.17, "rate":32.00},
    {"lowerLimit":125325.21, "upperLimit":375975.61, "fixedFee":32691.18, "rate":34.00},
    {"lowerLimit":375975.62, "upperLimit":999999999, "fixedFee":117912.32,"rate":35.00}
  ]',
  '[
    {"lowerLimit":0.01,     "upperLimit":1768.96,  "subsidy":407.02},
    {"lowerLimit":1768.97,  "upperLimit":2653.38,  "subsidy":406.83},
    {"lowerLimit":2653.39,  "upperLimit":3472.84,  "subsidy":406.62},
    {"lowerLimit":3472.85,  "upperLimit":3537.87,  "subsidy":392.77},
    {"lowerLimit":3537.88,  "upperLimit":4446.15,  "subsidy":382.46},
    {"lowerLimit":4446.16,  "upperLimit":4717.18,  "subsidy":354.23},
    {"lowerLimit":4717.19,  "upperLimit":5335.42,  "subsidy":324.87},
    {"lowerLimit":5335.43,  "upperLimit":6224.67,  "subsidy":294.63},
    {"lowerLimit":6224.68,  "upperLimit":7113.90,  "subsidy":253.54},
    {"lowerLimit":7113.91,  "upperLimit":7382.33,  "subsidy":217.61},
    {"lowerLimit":7382.34,  "upperLimit":999999999,"subsidy":0}
  ]',
  '[
    {"yearsWorked":1,  "vacationDays":12},
    {"yearsWorked":2,  "vacationDays":14},
    {"yearsWorked":3,  "vacationDays":16},
    {"yearsWorked":4,  "vacationDays":18},
    {"yearsWorked":5,  "vacationDays":20},
    {"yearsWorked":6,  "vacationDays":22},
    {"yearsWorked":7,  "vacationDays":22},
    {"yearsWorked":8,  "vacationDays":22},
    {"yearsWorked":9,  "vacationDays":22},
    {"yearsWorked":10, "vacationDays":24},
    {"yearsWorked":15, "vacationDays":26},
    {"yearsWorked":20, "vacationDays":28},
    {"yearsWorked":25, "vacationDays":30},
    {"yearsWorked":30, "vacationDays":32}
  ]'
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Tabla PAYROLL_PERIODS ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type     TEXT NOT NULL CHECK (period_type IN ('weekly','biweekly','monthly')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  "group"         TEXT NOT NULL DEFAULT 'all',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  total_gross     NUMERIC(14,2) DEFAULT 0,
  total_net       NUMERIC(14,2) DEFAULT 0,
  total_imss_employer NUMERIC(14,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payroll_periods' AND policyname='payroll_periods_all') THEN
    CREATE POLICY payroll_periods_all ON public.payroll_periods FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 7. Tabla PAYROLL_ENTRIES ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id       UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES public.employees(id),
  days_worked     NUMERIC(5,2) NOT NULL DEFAULT 0,
  gross_salary    NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_hours  NUMERIC(5,2) DEFAULT 0,
  overtime_amount NUMERIC(12,2) DEFAULT 0,
  perceptions     JSONB DEFAULT '{}',
  deductions      JSONB DEFAULT '{}',
  net_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  imss_employee   NUMERIC(12,2) DEFAULT 0,
  imss_employer   NUMERIC(12,2) DEFAULT 0,
  isr_withheld    NUMERIC(12,2) DEFAULT 0,
  subsidy_applied NUMERIC(12,2) DEFAULT 0
);

ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payroll_entries' AND policyname='payroll_entries_all') THEN
    CREATE POLICY payroll_entries_all ON public.payroll_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 8. Tabla PROJECTS (Ventas) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  TEXT REFERENCES public.opportunities(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  business_unit   TEXT NOT NULL,
  project_name    TEXT NOT NULL,
  service_type    TEXT,
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','completado','cancelado')),
  start_date      DATE,
  end_date        DATE,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='projects_all') THEN
    CREATE POLICY projects_all ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 9. Tabla INVOICES (Ventas) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  folio           TEXT,
  concepts        JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  iva             NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador','emitida','cobrada','cancelada')),
  issued_at       TIMESTAMPTZ,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  payment_notes   TEXT,
  -- CFDI fields (nullable until PAC integration)
  cfdi_uuid       TEXT,
  cfdi_seal       TEXT,
  cfdi_chain      TEXT,
  cfdi_pac_name   TEXT,
  cfdi_xml_url    TEXT,
  cfdi_pdf_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoices' AND policyname='invoices_all') THEN
    CREATE POLICY invoices_all ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 10. Tabla SUPPLIERS (Compras) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name      TEXT NOT NULL,
  legal_name      TEXT,
  rfc             TEXT,
  category        TEXT NOT NULL DEFAULT 'servicios',
  contact         JSONB DEFAULT '{}',
  payment_terms   TEXT,
  rating          INT CHECK (rating BETWEEN 1 AND 5),
  documents       JSONB DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='suppliers' AND policyname='suppliers_all') THEN
    CREATE POLICY suppliers_all ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 11. Tabla PURCHASE_REQUESTS ───────────────────────────
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID REFERENCES auth.users(id),
  project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit            TEXT NOT NULL DEFAULT 'pieza',
  justification   TEXT,
  urgency         TEXT NOT NULL DEFAULT 'media' CHECK (urgency IN ('alta','media','baja')),
  status          TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','cotizando','aprobada','cancelada')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='purchase_requests' AND policyname='purchase_requests_all') THEN
    CREATE POLICY purchase_requests_all ON public.purchase_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 12. Tabla PURCHASE_QUOTES ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchase_quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES public.suppliers(id),
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_days   INT DEFAULT 0,
  conditions      TEXT,
  selected        BOOLEAN DEFAULT FALSE,
  selection_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_quotes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='purchase_quotes' AND policyname='purchase_quotes_all') THEN
    CREATE POLICY purchase_quotes_all ON public.purchase_quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 13. Tabla PURCHASE_ORDERS ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES public.purchase_requests(id),
  supplier_id     UUID NOT NULL REFERENCES public.suppliers(id),
  quote_id        UUID REFERENCES public.purchase_quotes(id),
  status          TEXT NOT NULL DEFAULT 'borrador'
                  CHECK (status IN ('borrador','aprobada','enviada','recibida_parcial','recibida_completa','cancelada')),
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  issued_at       TIMESTAMPTZ,
  received_at     TIMESTAMPTZ,
  invoice_xml_url TEXT,
  invoice_pdf_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='purchase_orders' AND policyname='purchase_orders_all') THEN
    CREATE POLICY purchase_orders_all ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
