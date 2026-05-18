-- =====================================================================
-- 20260517000200_trigger_opportunity_won_creates_project.sql
-- Fase 4 — Mover la creación automática de project a un trigger DB,
-- para que NO se pueda saltar desde el cliente.
-- WON_STAGE = 'cerrada_ganada' (en src/styles/theme.ts).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_opportunity_won_create_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_stage text := COALESCE(OLD.data->>'stage', '');
  new_stage  text := COALESCE(NEW.data->>'stage', '');
  client_uuid uuid;
BEGIN
  -- Solo dispara si entró a cerrada_ganada
  IF new_stage <> 'cerrada_ganada' OR prev_stage = 'cerrada_ganada' THEN
    RETURN NEW;
  END IF;

  -- Necesitamos un cliente vinculado
  client_uuid := NEW.client_id;
  IF client_uuid IS NULL AND NEW.data ? 'clientId' THEN
    -- Cast defensivo: si data->>'clientId' es string vacío o no-uuid, dejamos NULL.
    BEGIN
      client_uuid := NULLIF(NEW.data->>'clientId', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      client_uuid := NULL;
    END;
  END IF;
  IF client_uuid IS NULL THEN
    RAISE NOTICE 'opportunity % marcada como ganada sin cliente — no se crea project', NEW.id;
    RETURN NEW;
  END IF;

  -- Idempotente: si ya hay project para esta opp, no duplicar
  IF EXISTS (SELECT 1 FROM public.projects WHERE opportunity_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.projects (
    id, opportunity_id, client_id, business_unit,
    project_name, service_type, amount, status, start_date, created_at
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    client_uuid,
    COALESCE(NEW.data->>'businessUnit', 'eventos'),
    COALESCE(NEW.data->>'projectName', NEW.data->>'company', 'Sin nombre'),
    COALESCE(NEW.data->>'orgType', ''),
    COALESCE((NEW.data->>'amount')::numeric, 0),
    'activo',
    CURRENT_DATE,
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunity_won ON public.opportunities;

CREATE TRIGGER trg_opportunity_won
AFTER UPDATE OF data ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.fn_opportunity_won_create_project();

-- NOTA: el flujo del cliente siempre crea opportunity en stage abierta y
-- luego la mueve. Si en el futuro hace falta cubrir INSERT directo en
-- stage ganada, agregar un trigger AFTER INSERT que llame al mismo handler.
