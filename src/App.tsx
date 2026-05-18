import { useState, useEffect, lazy, Suspense, type ReactNode, type CSSProperties } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { LoginScreen } from '@/auth/LoginScreen';
import { PasswordRecoveryScreen } from '@/auth/PasswordRecoveryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BootError } from '@/components/BootError';
import { C, LOGO, APP_NAME } from '@/styles/theme';
import type { User, Profile } from '@/types';
import type { Session } from '@supabase/supabase-js';

/* ── Code-split: cada módulo se carga solo cuando el usuario entra a su ruta ── */
const CRMApp        = lazy(() => import('@/modules/crm/CRMApp').then((m) => ({ default: m.CRMApp })));
const NominaModule  = lazy(() => import('@/modules/nomina').then((m) => ({ default: m.NominaModule })));
const VentasModule  = lazy(() => import('@/modules/ventas').then((m) => ({ default: m.VentasModule })));
const ComprasModule = lazy(() => import('@/modules/compras').then((m) => ({ default: m.ComprasModule })));

function ModuleLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDim, fontSize: 13 }}>
      Cargando módulo…
    </div>
  );
}

/* ── Auth Guard ── */
function AuthenticatedApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <BrowserRouter basename="/erp">
      <Suspense fallback={<ModuleLoading />}>
        <Routes>
          {/* CRM — full-screen, has its own nav/sidebar */}
          <Route path="/crm/*" element={<CRMApp user={user} onLogout={onLogout} />} />

          {/* ERP modules — wrapped in shared shell */}
          <Route path="/nomina/*" element={<ERPShell user={user} onLogout={onLogout}><NominaModule /></ERPShell>} />
          <Route path="/ventas/*" element={<ERPShell user={user} onLogout={onLogout}><VentasModule /></ERPShell>} />
          <Route path="/compras/*" element={<ERPShell user={user} onLogout={onLogout}><ComprasModule user={user} /></ERPShell>} />

          {/* Default */}
          <Route path="*" element={<Navigate to="/crm" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

/* ── Shared ERP Shell (header + module nav) ── */
function ERPShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  const navLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
    color: isActive ? C.accent : C.textDim,
    background: isActive ? C.accentDim : 'transparent',
    borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 500,
    textDecoration: 'none', transition: 'all .15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 16px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <NavLink to="/crm">
            <img src={LOGO} alt={APP_NAME} style={{ height: 28, width: 'auto' }} />
          </NavLink>
          <nav style={{ display: 'flex', gap: 2 }}>
            <NavLink to="/crm" style={navLinkStyle}>CRM</NavLink>
            <NavLink to="/ventas" style={navLinkStyle}>Ventas</NavLink>
            <NavLink to="/nomina" style={navLinkStyle}>Nómina</NavLink>
            <NavLink to="/compras" style={navLinkStyle}>Compras</NavLink>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: C.textDim, fontSize: 12 }}>{user.name}</span>
          <button onClick={onLogout}
            style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            Salir
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

/* ── Root ── */
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (cancelled) return;
        if (error) { setBootError(error.message); return; }
        setSession(session);
      })
      .catch((e) => { if (!cancelled) setBootError(String(e?.message ?? e)); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      else { setRecovering(false); setSession(session); }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    // No limpiamos el perfil cuando session==null porque el render guard
    // (`if (!session) return <LoginScreen />`) corta antes de usarlo.
    // Esto evita el cascading render que react-hooks/set-state-in-effect flag.
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (cancelled) return;
        if (error) {
          setBootError(`No pudimos cargar tu perfil (${error.code ?? 'unknown'}): ${error.message}`);
          return;
        }
        setProfile(data as Profile);
      } catch (e) {
        if (!cancelled) setBootError(String((e as Error)?.message ?? e));
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  if (bootError) {
    return (
      <BootError
        message={bootError}
        onRetry={() => { setBootError(null); window.location.reload(); }}
      />
    );
  }

  if (recovering) return <PasswordRecoveryScreen />;
  if (session === undefined) return <div style={{ background: C.bg, minHeight: '100vh' }} />;
  if (!session) return <LoginScreen />;
  if (session && !profile) return <div style={{ background: C.bg, minHeight: '100vh' }} />;

  if (profile?.active === false) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.surface, borderRadius: 16, padding: 40, textAlign: 'center', border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
        <div style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Cuenta desactivada</div>
        <div style={{ color: C.textDim, fontSize: 13, marginBottom: 20 }}>Contacta al administrador para recuperar el acceso.</div>
        <button onClick={() => supabase.auth.signOut()}
          style={{ background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  const user: User = {
    userId: session.user.id,
    email: session.user.email!,
    name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
    role: profile?.role || 'user',
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthenticatedApp user={user} onLogout={() => supabase.auth.signOut()} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
