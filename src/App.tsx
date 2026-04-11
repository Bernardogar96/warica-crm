import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { LoginScreen } from '@/auth/LoginScreen';
import { PasswordRecoveryScreen } from '@/auth/PasswordRecoveryScreen';
import { CRMApp } from '@/modules/crm/CRMApp';
import { NominaModule } from '@/modules/nomina';
import { VentasModule } from '@/modules/ventas';
import { ComprasModule } from '@/modules/compras';
import { C, LOGO, APP_NAME } from '@/styles/theme';
import type { User, Profile } from '@/types';
import type { Session } from '@supabase/supabase-js';

/* ── Auth Guard ── */
function AuthenticatedApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

/* ── Shared ERP Shell (header + module nav) ── */
function ERPShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: React.ReactNode }) {
  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
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
            <NavLink to="/nomina" style={navLinkStyle}>Nómina</NavLink>
            <NavLink to="/ventas" style={navLinkStyle}>Ventas</NavLink>
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      else { setRecovering(false); setSession(session); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data as Profile));
  }, [session]);

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
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp user={user} onLogout={() => supabase.auth.signOut()} />
    </QueryClientProvider>
  );
}
