import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useConfig } from '@/modules/crm/context';
import {
  C, inputStyle, inputSmall, btnPrimary, btnSmall, h2Style,
} from '@/styles/theme';
import type { Profile, CrmConfig } from '@/types';

interface AdminViewProps {
  currentUserId: string;
}

export function AdminView({ currentUserId }: AdminViewProps) {
  const { config, setConfig } = useConfig();
  const [section, setSection] = useState<'users' | 'passwords' | 'config'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<CrmConfig>(config);

  useEffect(() => { setLocalConfig(config); }, [config]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at').then(({ data }) => setUsers((data as Profile[]) || []));
  }, []);

  const toggleRole = async (u: Profile) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
    setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role: newRole } : p)));
  };

  const toggleActive = async (u: Profile) => {
    if (u.id === currentUserId) return;
    const newActive = !u.active;
    await supabase.from('profiles').update({ active: newActive }).eq('id', u.id);
    setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, active: newActive } : p)));
  };

  const saveConfig = async () => {
    setSaving(true);
    await supabase.from('crm_config').update({
      stages: localConfig.stages,
      lost_reasons: localConfig.lostReasons,
    }).eq('id', 'default');
    setConfig(localConfig);
    setSaving(false);
  };

  const [resetMsg, setResetMsg] = useState<Record<string, { ok: boolean; text: string }>>({});
  const sendReset = async (u: Profile) => {
    if (!u.email) { setResetMsg({ [u.id]: { ok: false, text: 'Sin email' } }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, { redirectTo: window.location.origin });
    setResetMsg({ [u.id]: error ? { ok: false, text: 'Error' } : { ok: true, text: 'Enviado' } });
    setTimeout(() => setResetMsg({}), 3000);
  };

  function EditableList({ label, field }: { label: string; field: keyof CrmConfig }) {
    const items = (localConfig[field] as string[]) || [];
    const [newItem, setNewItem] = useState('');
    const update = (newList: string[]) => setLocalConfig({ ...localConfig, [field]: newList });
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={item} onChange={(e) => { const l = [...items]; l[i] = e.target.value; update(l); }}
                style={{ ...inputSmall, flex: 1 }} />
              <button onClick={() => update(items.filter((_, j) => j !== i))}
                style={{ ...btnSmall, color: C.danger, fontSize: 16 }}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { update([...items, newItem.trim()]); setNewItem(''); } }}
              placeholder="Agregar..." style={{ ...inputSmall, flex: 1 }} />
            <button onClick={() => { if (newItem.trim()) { update([...items, newItem.trim()]); setNewItem(''); } }}
              style={{ ...btnPrimary, padding: '5px 14px', fontSize: 12 }}>+</button>
          </div>
        </div>
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px', color: C.textDim, fontWeight: 500, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.border}`,
  };
  const tdStyle: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' };
  const sBtn = (id: typeof section, label: string) => (
    <button onClick={() => setSection(id)}
      style={{ background: section === id ? C.accentDim : 'transparent', color: section === id ? C.accent : C.textDim, border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>
      {label}
    </button>
  );

  return (
    <div>
      <h2 style={h2Style}>Administración</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, width: 'fit-content', border: `1px solid ${C.border}` }}>
        {sBtn('users', '👥 Usuarios')}
        {sBtn('passwords', '🔑 Contraseñas')}
        {sBtn('config', '⚙ Configuración')}
      </div>

      {section === 'users' && (
        <div>
          <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.surface, textAlign: 'left' }}>
                  {['Nombre', 'Rol', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: u.active === false ? 0.5 : 1 }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                      {u.id === currentUserId && <div style={{ fontSize: 10, color: C.accent }}>Tú</div>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: u.role === 'admin' ? C.accentDim : C.border + '40', color: u.role === 'admin' ? C.accent : C.textDim, borderRadius: 6, padding: '2px 10px', fontSize: 12 }}>{u.role}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: u.active !== false ? C.success : C.danger, fontSize: 12 }}>{u.active !== false ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => toggleRole(u)} disabled={u.id === currentUserId} style={{ ...btnSmall, opacity: u.id === currentUserId ? 0.3 : 1 }}>
                        {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                      <button onClick={() => toggleActive(u)} disabled={u.id === currentUserId}
                        style={{ ...btnSmall, color: u.active !== false ? C.danger : C.success, marginLeft: 4, opacity: u.id === currentUserId ? 0.3 : 1 }}>
                        {u.active !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>🔗 Link de registro para nuevos usuarios</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={window.location.origin} style={{ ...inputSmall, flex: 1, color: C.textDim }} />
              <button onClick={() => navigator.clipboard.writeText(window.location.origin)} style={{ ...btnPrimary, padding: '5px 14px', fontSize: 12 }}>Copiar</button>
            </div>
          </div>
        </div>
      )}

      {section === 'passwords' && (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: C.surface, borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textDim }}>
            Envía un correo de restablecimiento de contraseña a cualquier usuario.
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, textAlign: 'left' }}>
                {['Nombre', 'Correo', 'Rol', 'Acción'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>{u.name || '—'} {u.id === currentUserId && <span style={{ fontSize: 10, color: C.accent }}>(tú)</span>}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{u.email || '—'}</td>
                  <td style={tdStyle}><span style={{ background: u.role === 'admin' ? C.accentDim : C.border + '40', color: u.role === 'admin' ? C.accent : C.textDim, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{u.role}</span></td>
                  <td style={tdStyle}>
                    <button onClick={() => sendReset(u)} style={{ ...btnPrimary, padding: '5px 12px', fontSize: 12 }}>Enviar reset</button>
                    {resetMsg[u.id] && <span style={{ marginLeft: 8, fontSize: 12, color: resetMsg[u.id].ok ? C.success : C.danger }}>{resetMsg[u.id].text}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'config' && (
        <div style={{ background: C.card, borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            <EditableList label="Etapas del pipeline (todas las unidades)" field="stages" />
            <EditableList label="Razones de cancelación" field="lostReasons" />
          </div>
          <button onClick={saveConfig} disabled={saving} style={{ ...btnPrimary, marginTop: 8, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  );
}
