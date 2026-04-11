import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C, inputStyle, btnPrimary, LOGO, APP_NAME } from '@/styles/theme';

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    setErr('');
    if (!email.includes('@') || pass.length < 4) {
      setErr('Correo inválido o contraseña muy corta');
      return;
    }
    setLoading(true);
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name: name || email.split('@')[0] } },
      });
      if (error) setErr(error.message);
      else setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setErr('Credenciales incorrectas');
    }
    setLoading(false);
  };

  if (emailSent)
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 400, background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Revisa tu correo</h2>
          <p style={{ color: C.textDim, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Te enviamos un enlace de confirmación a{' '}
            <strong style={{ color: C.accent }}>{email}</strong>.<br />
            Haz click en el enlace para activar tu cuenta y luego inicia sesión.
          </p>
          <button onClick={() => { setEmailSent(false); setMode('login'); }} style={{ ...btnPrimary, width: '100%' }}>
            Ya confirmé, iniciar sesión
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400, background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO} alt={APP_NAME} style={{ height: 56, width: 'auto' }} />
          <div style={{ color: C.textDim, marginTop: 8, fontSize: 14 }}>Sistema de gestión Warica</div>
        </div>
        {mode === 'register' && (
          <input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }} />
        )}
        <input placeholder="correo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, marginBottom: 8 }} type="email" />
        <input placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)}
          style={{ ...inputStyle, marginBottom: 8 }} type="password"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ ...btnPrimary, width: '100%', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: C.textDim, fontSize: 13 }}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <span onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}
              style={{ color: C.accent, cursor: 'pointer' }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
