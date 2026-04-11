import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C, inputStyle, btnPrimary, h2Style } from '@/styles/theme';
import { Field } from '@/components/Field';
import type { User } from '@/types';

interface ProfileViewProps {
  user: User;
}

export function ProfileView({ user }: ProfileViewProps) {
  const [name, setName] = useState(user.name || '');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.userId);
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setNameMsg({ ok: true, text: 'Nombre actualizado' });
    setSaving(false);
    setTimeout(() => setNameMsg(null), 3000);
  };

  const savePassword = async () => {
    if (newPass.length < 6) { setPassMsg({ ok: false, text: 'Mínimo 6 caracteres' }); return; }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: 'Las contraseñas no coinciden' }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setPassMsg({ ok: false, text: error.message });
    else { setPassMsg({ ok: true, text: 'Contraseña actualizada' }); setNewPass(''); setConfirmPass(''); }
    setSaving(false);
    setTimeout(() => setPassMsg(null), 3000);
  };

  const card: React.CSSProperties = { background: C.card, borderRadius: 12, padding: 24, marginBottom: 16 };

  return (
    <div>
      <h2 style={h2Style}>Mi Perfil</h2>
      <div style={card}>
        <div style={{ fontSize: 12, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Información personal
        </div>
        <Field label="Correo electrónico">
          <input value={user.email} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
        </Field>
        <Field label="Nombre">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Tu nombre" />
        </Field>
        {nameMsg && <div style={{ fontSize: 13, color: nameMsg.ok ? C.success : C.danger, marginBottom: 8 }}>{nameMsg.text}</div>}
        <button onClick={saveName} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
          Guardar nombre
        </button>
      </div>
      <div style={card}>
        <div style={{ fontSize: 12, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Cambiar contraseña
        </div>
        <Field label="Nueva contraseña">
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={inputStyle} placeholder="Mínimo 6 caracteres" />
        </Field>
        <Field label="Confirmar contraseña">
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} style={inputStyle} placeholder="Repite la contraseña"
            onKeyDown={(e) => e.key === 'Enter' && savePassword()} />
        </Field>
        {passMsg && <div style={{ fontSize: 13, color: passMsg.ok ? C.success : C.danger, marginBottom: 8 }}>{passMsg.text}</div>}
        <button onClick={savePassword} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
          Actualizar contraseña
        </button>
      </div>
    </div>
  );
}
