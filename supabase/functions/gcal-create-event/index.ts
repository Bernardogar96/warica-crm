// supabase/functions/gcal-create-event/index.ts
//
// Proxy autenticado al Apps Script Webhook de Google Calendar.
// Antes: el cliente llamaba directo al Apps Script (URL pública sin token).
// Ahora: el cliente llama a esta Edge Function, que valida la sesión y
// retransmite al Apps Script con un secret en header. El secret nunca
// llega al browser.
//
// Env vars que esta función necesita (configurar con `supabase secrets set`):
//   GCAL_WEBHOOK_URL = https://script.google.com/macros/s/.../exec
//   GCAL_WEBHOOK_TOKEN = <random secret>
//
// En el Apps Script, valida que `e.parameter.token === <mismo secret>` y
// rechaza con 401 si no coincide.
//
// Deploy: `supabase functions deploy gcal-create-event`
// Llamar desde el cliente:
//   await supabase.functions.invoke('gcal-create-event', { body: { ...evento } })

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1. Auth del usuario
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return json({ error: 'Unauthorized' }, 401);

  // 2. Validar perfil activo
  const { data: profile } = await supabase.from('profiles')
    .select('active').eq('id', user.id).single();
  if (!profile || profile.active === false) return json({ error: 'Forbidden' }, 403);

  // 3. Tomar el payload del evento y reenviar al Apps Script con token
  const gcalUrl = Deno.env.get('GCAL_WEBHOOK_URL');
  const gcalToken = Deno.env.get('GCAL_WEBHOOK_TOKEN');
  if (!gcalUrl || !gcalToken) return json({ error: 'Webhook not configured' }, 500);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  try {
    const upstream = await fetch(gcalUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, token: gcalToken, _user_id: user.id }),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...CORS, 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    return json({ error: 'Upstream failure: ' + (e as Error).message }, 502);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}
