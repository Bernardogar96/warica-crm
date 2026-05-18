// supabase/functions/approve-quote/index.ts
//
// Aprueba un purchase_quote y crea el purchase_order correspondiente.
// Esta lógica vive aquí (no en el cliente) para que NADIE pueda saltarse
// las validaciones llamando directo a la tabla.
//
// Deploy: `supabase functions deploy approve-quote`
// Llamar desde el cliente:
//   await supabase.functions.invoke('approve-quote', { body: { quote_id } })

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // ── 1. Auth: ¿quién es el caller? ──────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    // ── 2. Autorización: solo admin/compras ────────────────
    const { data: profile, error: profileErr } = await callerClient
      .from('profiles').select('role, active').eq('id', user.id).single();
    if (profileErr || !profile) return json({ error: 'Forbidden' }, 403);
    if (profile.active === false) return json({ error: 'Forbidden: account disabled' }, 403);
    if (!['admin', 'compras'].includes(profile.role)) {
      return json({ error: 'Forbidden: requires admin or compras role' }, 403);
    }

    // ── 3. Body ─────────────────────────────────────────────
    let body: { quote_id?: string; selection_notes?: string };
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { quote_id, selection_notes } = body;
    if (!quote_id) return json({ error: 'quote_id required' }, 400);

    // ── 4. Use service_role para bypass RLS de forma controlada ─
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 4.1 Cargar el quote
    const { data: quote, error: qErr } = await admin
      .from('purchase_quotes').select('*').eq('id', quote_id).single();
    if (qErr || !quote) return json({ error: 'Quote not found' }, 404);
    if (quote.selected) return json({ error: 'Quote already selected' }, 409);

    // 4.2 Cargar el request asociado
    const { data: request, error: rErr } = await admin
      .from('purchase_requests').select('*').eq('id', quote.request_id).single();
    if (rErr || !request) return json({ error: 'Request not found' }, 404);
    if (request.status === 'cancelada') return json({ error: 'Request cancelled' }, 409);

    // ── 5. Transacción lógica ──────────────────────────────
    // 5.1 Marcar los demás quotes del request como no seleccionados
    await admin.from('purchase_quotes')
      .update({ selected: false })
      .eq('request_id', quote.request_id);

    // 5.2 Marcar este quote como seleccionado
    await admin.from('purchase_quotes')
      .update({ selected: true, selection_notes: selection_notes ?? null })
      .eq('id', quote_id);

    // 5.3 Actualizar el request a 'aprobada'
    await admin.from('purchase_requests')
      .update({ status: 'aprobada' })
      .eq('id', quote.request_id);

    // 5.4 Crear el purchase_order
    const orderId = crypto.randomUUID();
    const { error: poErr } = await admin.from('purchase_orders').insert({
      id: orderId,
      request_id: quote.request_id,
      supplier_id: quote.supplier_id,
      quote_id: quote.id,
      status: 'aprobada',
      total: quote.total,
      issued_at: new Date().toISOString(),
    });
    if (poErr) return json({ error: 'Failed to create PO: ' + poErr.message }, 500);

    return json({ ok: true, purchase_order_id: orderId }, 200);
  } catch (e) {
    console.error('[approve-quote] crash', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}
