


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                                                                                                                                                                                                                                                        
  begin                                                                                                                                                                                                                                                                        
    insert into public.profiles (id, name, email)
    values (
      new.id,                                                                                                                                                                                                                                                                  
      new.raw_user_meta_data->>'name',
      new.email                                                                                                                                                                                                                                                                
    );            
    return new;
  end;
  $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade_name" "text" NOT NULL,
    "legal_name" "text",
    "industry" "text",
    "company_size" "text",
    "website" "text",
    "social_media" "jsonb" DEFAULT '{}'::"jsonb",
    "fiscal_address" "jsonb" DEFAULT '{}'::"jsonb",
    "operational_address" "text",
    "phones" "text"[] DEFAULT '{}'::"text"[],
    "emails" "text"[] DEFAULT '{}'::"text"[],
    "contacts" "jsonb" DEFAULT '[]'::"jsonb",
    "rfc" "text",
    "tax_regime" "text",
    "cfdi_use" "text",
    "invoice_email" "text",
    "payment_terms" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_config" (
    "id" "text" DEFAULT 'default'::"text" NOT NULL,
    "stages" "jsonb" DEFAULT '["Primer Contacto", "Cotizado", "Negociación", "Cierre"]'::"jsonb",
    "service_types" "jsonb" DEFAULT '["Integraciones Corporativas", "Diseño de Rutas en Montaña", "Limpieza de Rutas", "Rutas Guiadas", "Capacitación Outdoor", "Team Building", "Otro"]'::"jsonb",
    "org_types" "jsonb" DEFAULT '["Empresa", "Colegio", "Gobierno", "ONG", "Asociación", "Otro"]'::"jsonb",
    "company_sizes" "jsonb" DEFAULT '["1-10", "11-50", "51-200", "201-500", "500+"]'::"jsonb",
    "lost_reasons" "jsonb" DEFAULT '["Precio muy alto", "Eligió competencia", "Sin presupuesto", "No respondió", "Timing inadecuado", "No era decisor", "Cambio de prioridades", "Otro"]'::"jsonb"
);


ALTER TABLE "public"."crm_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "curp" "text",
    "rfc" "text",
    "nss" "text",
    "full_name" "text" NOT NULL,
    "birth_date" "date",
    "sex" character(1),
    "marital_status" "text",
    "hire_date" "date" NOT NULL,
    "contract_type" "text" DEFAULT 'indeterminado'::"text" NOT NULL,
    "group" character(1) DEFAULT 'A'::"bpchar" NOT NULL,
    "position" "text",
    "department" "text",
    "workday_type" "text" DEFAULT 'completa'::"text",
    "daily_salary" numeric(12,4) DEFAULT 0 NOT NULL,
    "sdi" numeric(12,4) DEFAULT 0 NOT NULL,
    "sbc" numeric(12,4) DEFAULT 0 NOT NULL,
    "bank" "text",
    "clabe" "text",
    "status" "text" DEFAULT 'activo'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employees_group_check" CHECK (("group" = ANY (ARRAY['A'::"bpchar", 'B'::"bpchar", 'C'::"bpchar"]))),
    CONSTRAINT "employees_status_check" CHECK (("status" = ANY (ARRAY['activo'::"text", 'baja'::"text", 'suspendido'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "client_id" "uuid",
    "folio" "text",
    "concepts" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "iva" numeric(14,2) DEFAULT 0 NOT NULL,
    "total" numeric(14,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'borrador'::"text" NOT NULL,
    "issued_at" timestamp with time zone,
    "due_date" "date",
    "paid_at" timestamp with time zone,
    "payment_notes" "text",
    "cfdi_uuid" "text",
    "cfdi_seal" "text",
    "cfdi_chain" "text",
    "cfdi_pac_name" "text",
    "cfdi_xml_url" "text",
    "cfdi_pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['borrador'::"text", 'emitida'::"text", 'cobrada'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "client_id" "uuid"
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_config" (
    "id" "text" DEFAULT 'default'::"text" NOT NULL,
    "year" integer DEFAULT (EXTRACT(year FROM "now"()))::integer NOT NULL,
    "uma" numeric(12,4) DEFAULT 113.14 NOT NULL,
    "smg" numeric(12,4) DEFAULT 278.80 NOT NULL,
    "isr_table" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subsidy_table" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "vacation_table" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payroll_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "days_worked" numeric(5,2) DEFAULT 0 NOT NULL,
    "gross_salary" numeric(12,2) DEFAULT 0 NOT NULL,
    "overtime_hours" numeric(5,2) DEFAULT 0,
    "overtime_amount" numeric(12,2) DEFAULT 0,
    "perceptions" "jsonb" DEFAULT '{}'::"jsonb",
    "deductions" "jsonb" DEFAULT '{}'::"jsonb",
    "net_salary" numeric(12,2) DEFAULT 0 NOT NULL,
    "imss_employee" numeric(12,2) DEFAULT 0,
    "imss_employer" numeric(12,2) DEFAULT 0,
    "isr_withheld" numeric(12,2) DEFAULT 0,
    "subsidy_applied" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."payroll_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "group" "text" DEFAULT 'all'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_gross" numeric(14,2) DEFAULT 0,
    "total_net" numeric(14,2) DEFAULT 0,
    "total_imss_employer" numeric(14,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_periods_period_type_check" CHECK (("period_type" = ANY (ARRAY['weekly'::"text", 'biweekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "payroll_periods_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'approved'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."payroll_periods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "role" "text" DEFAULT 'user'::"text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "opportunity_id" "text",
    "client_id" "uuid",
    "business_unit" "text" NOT NULL,
    "project_name" "text" NOT NULL,
    "service_type" "text",
    "amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'activo'::"text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "completed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['activo'::"text", 'completado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "quote_id" "uuid",
    "status" "text" DEFAULT 'borrador'::"text" NOT NULL,
    "total" numeric(12,2) DEFAULT 0 NOT NULL,
    "issued_at" timestamp with time zone,
    "received_at" timestamp with time zone,
    "invoice_xml_url" "text",
    "invoice_pdf_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchase_orders_status_check" CHECK (("status" = ANY (ARRAY['borrador'::"text", 'aprobada'::"text", 'enviada'::"text", 'recibida_parcial'::"text", 'recibida_completa'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "total" numeric(12,2) DEFAULT 0 NOT NULL,
    "delivery_days" integer DEFAULT 0,
    "conditions" "text",
    "selected" boolean DEFAULT false,
    "selection_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid",
    "project_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "unit" "text" DEFAULT 'pza'::"text" NOT NULL,
    "justification" "text",
    "urgency" "text" DEFAULT 'media'::"text" NOT NULL,
    "status" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchase_requests_status_check" CHECK (("status" = ANY (ARRAY['pendiente'::"text", 'cotizando'::"text", 'aprobada'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "purchase_requests_urgency_check" CHECK (("urgency" = ANY (ARRAY['alta'::"text", 'media'::"text", 'baja'::"text"])))
);


ALTER TABLE "public"."purchase_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade_name" "text" NOT NULL,
    "legal_name" "text",
    "rfc" "text",
    "category" "text" DEFAULT 'Servicios'::"text" NOT NULL,
    "contact" "jsonb" DEFAULT '{}'::"jsonb",
    "payment_terms" "text",
    "rating" numeric(3,1),
    "documents" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "suppliers_rating_check" CHECK ((("rating" >= (1)::numeric) AND ("rating" <= (5)::numeric)))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_config"
    ADD CONSTRAINT "crm_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_curp_key" UNIQUE ("curp");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_config"
    ADD CONSTRAINT "payroll_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_entries"
    ADD CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_periods"
    ADD CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_quotes"
    ADD CONSTRAINT "purchase_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



CREATE INDEX "clients_rfc_idx" ON "public"."clients" USING "btree" ("rfc");



CREATE INDEX "clients_trade_name_idx" ON "public"."clients" USING "btree" ("lower"("trade_name"));



CREATE INDEX "opp_client_id_idx" ON "public"."opportunities" USING "btree" ("client_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payroll_entries"
    ADD CONSTRAINT "payroll_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."payroll_entries"
    ADD CONSTRAINT "payroll_entries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."purchase_quotes"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."purchase_requests"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."purchase_quotes"
    ADD CONSTRAINT "purchase_quotes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_quotes"
    ADD CONSTRAINT "purchase_quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow anon insert from google_forms" ON "public"."opportunities" FOR INSERT TO "anon" WITH CHECK (((("data" ->> 'source'::"text") = 'google_forms'::"text") AND (("data" ->> 'stage'::"text") = 'Backlog'::"text")));



CREATE POLICY "Service role can manage all profiles" ON "public"."profiles" USING (true) WITH CHECK (true);



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "admin_update_config" ON "public"."crm_config" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "admin_update_profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "authenticated_all" ON "public"."opportunities" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete" ON "public"."clients" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "clients_insert" ON "public"."clients" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "clients_select" ON "public"."clients" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "clients_update" ON "public"."clients" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."crm_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_all" ON "public"."employees" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_all" ON "public"."invoices" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."opportunities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payroll_config_all" ON "public"."payroll_config" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."payroll_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payroll_entries_all" ON "public"."payroll_entries" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."payroll_periods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payroll_periods_all" ON "public"."payroll_periods" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_all" ON "public"."projects" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchase_orders_all" ON "public"."purchase_orders" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."purchase_quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchase_quotes_all" ON "public"."purchase_quotes" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."purchase_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchase_requests_all" ON "public"."purchase_requests" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "read_config" ON "public"."crm_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "read_profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "self_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("role" = ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))));



ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_all" ON "public"."suppliers" TO "authenticated" USING (true) WITH CHECK (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."crm_config" TO "anon";
GRANT ALL ON TABLE "public"."crm_config" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_config" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."opportunities" TO "anon";
GRANT ALL ON TABLE "public"."opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_config" TO "anon";
GRANT ALL ON TABLE "public"."payroll_config" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_config" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_entries" TO "anon";
GRANT ALL ON TABLE "public"."payroll_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_entries" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_periods" TO "anon";
GRANT ALL ON TABLE "public"."payroll_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_periods" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_quotes" TO "anon";
GRANT ALL ON TABLE "public"."purchase_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requests" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requests" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







