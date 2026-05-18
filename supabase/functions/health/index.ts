// supabase/functions/health/index.ts
//
// Health check para uptime monitors (UptimeRobot, BetterStack).
// Deploy: `supabase functions deploy health --no-verify-jwt`
// Endpoint: https://<project-ref>.functions.supabase.co/health
//
// Devuelve 200 si la DB responde, 500 si no.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const started = Date.now();
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return new Response(
      JSON.stringify({ status: 'ok', latency_ms: Date.now() - started }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ status: 'error', error: (e as Error).message, latency_ms: Date.now() - started }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
});
