/**
 * Sentry init — guarded por env var y por presencia del paquete.
 *
 * Para activarlo en producción:
 *   1. npm install @sentry/react
 *   2. Crea proyecto en sentry.io (gratis hasta 5k events/mes)
 *   3. En Vercel → Environment Variables agrega:
 *        VITE_SENTRY_DSN=https://...@sentry.io/...
 *   4. (Opcional) VITE_SENTRY_ENV=production / staging
 *   5. Redeploy.
 *
 * Si la env var no está, este módulo no hace nada (zero overhead en dev).
 * Si el paquete `@sentry/react` no está instalado, también es no-op.
 *
 * Se carga dinámicamente para que el bundle de login (cold path) no pague
 * el costo hasta que Sentry esté configurado.
 */

let initialized = false;

// Helper que tolera la ausencia del paquete en tiempo de typecheck.
// Una vez instalado @sentry/react, la importación dinámica funciona normal.
async function loadSentry(): Promise<Record<string, unknown> | null> {
  try {
    // @ts-expect-error — el paquete puede no estar instalado todavía
    return await import('@sentry/react');
  } catch {
    return null;
  }
}

export async function initSentry(): Promise<void> {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await loadSentry();
  if (!Sentry) {
    console.warn('[sentry] paquete no instalado; corre `npm install @sentry/react`.');
    return;
  }

  type SentryShape = {
    init: (cfg: unknown) => void;
    browserTracingIntegration: () => unknown;
    replayIntegration: (cfg: unknown) => unknown;
  };
  const S = Sentry as unknown as SentryShape;

  S.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENV ?? import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    integrations: [
      S.browserTracingIntegration(),
      S.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
  initialized = true;
}

export async function setSentryUser(
  user: { id: string; email?: string; role?: string } | null,
): Promise<void> {
  if (!initialized) return;
  const Sentry = await loadSentry();
  if (!Sentry) return;
  const S = Sentry as unknown as { setUser: (u: unknown) => void };
  S.setUser(user ? { id: user.id, email: user.email, segment: user.role } : null);
}

export async function captureException(err: unknown): Promise<void> {
  if (!initialized) return;
  const Sentry = await loadSentry();
  if (!Sentry) return;
  const S = Sentry as unknown as { captureException: (e: unknown) => void };
  S.captureException(err);
}
