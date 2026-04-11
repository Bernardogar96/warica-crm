import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C, inputStyle, btnPrimary, btnSecondary, LOGO, APP_NAME } from '@/styles/theme';
import { Field } from '@/components/Field';

export function PasswordRecoveryScreen() {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);

  const save = async () => {
    if (newPass.length < 6) { setMsg({ ok: false, text: 'Mínimo 6 caracteres' }); return; }
    if (newPass !== confirmPass) { setMsg({ ok: false, text: 'Las contraseñas no coinciden' }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setMsg({ ok: false, text: error.message });
    else { setMsg({ ok: true, text: 'Contraseña actualizada correctamente' }); setDone(true); }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400, background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={LOGO} alt={APP_NAME} style={{ height: 48, width: 'auto' }} />
          <div style={{ color: C.text, fontWeight: 600, fontSize: 18, marginTop: 16 }}>Nueva contraseña</div>
        </div>
        {done ? (
          <>
            <div style={{ color: C.success, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>✓ {msg?.text}</div>
            <button onClick={() => supabase.auth.signOut()} style={{ ...btnPrimary, width: '100%' }}>Ir al login</button>
          </>
        ) : (
          <>
            <Field label="Nueva contraseña">
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }} placeholder="Mínimo 6 caracteres" />
            </Field>
            <Field label="Confirmar contraseña">
              <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }} placeholder="Repite la contraseña"
                onKeyDown={(e) => e.key === 'Enter' && save()} />
            </Field>
            {msg && <div style={{ color: msg.ok ? C.success : C.danger, fontSize: 13, marginBottom: 12 }}>{msg.text}</div>}
            <button onClick={save} style={{ ...btnPrimary, width: '100%' }}>Guardar contraseña</button>
          </>
        )}
        {!done && (
          <button onClick={() => supabase.auth.signOut()} style={{ ...btnSecondary, width: '100%', marginTop: 8 }}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
