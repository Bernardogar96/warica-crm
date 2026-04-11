import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import {
  C, inputStyle, btnPrimary, btnSecondary, btnSmall, today,
} from '@/styles/theme';
import type { Employee } from '@/types';

interface Props {
  employee?: Employee;
  onSave: (data: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

const CONTRACT_TYPES: Employee['contractType'][] = ['indeterminado', 'determinado', 'obra', 'honorarios'];
const GROUPS: Employee['group'][] = ['A', 'B', 'C'];
const SEXES = [{ v: 'M', l: 'Masculino' }, { v: 'F', l: 'Femenino' }] as const;
const STATUSES: Employee['status'][] = ['activo', 'baja', 'suspendido'];
const WORKDAYS: Employee['workdayType'][] = ['completa', 'parcial'];

function emptyEmployee(): Omit<Employee, 'id' | 'createdAt'> {
  return {
    curp: '', rfc: '', nss: '', fullName: '', birthDate: '', sex: 'M',
    maritalStatus: '', hireDate: today(), contractType: 'indeterminado',
    group: 'A', position: '', department: '', workdayType: 'completa',
    dailySalary: 0, sdi: 0, sbc: 0, bank: '', clabe: '', status: 'activo',
  };
}

export function EmployeeModal({ employee, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Employee, 'id' | 'createdAt'>>(
    employee ? { ...employee } : emptyEmployee(),
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'laboral' | 'fiscal'>('personal');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.fullName || !form.hireDate) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button onClick={() => setActiveTab(id)}
      style={{
        background: activeTab === id ? C.accentDim : 'transparent',
        color: activeTab === id ? C.accent : C.textDim,
        border: 'none', borderRadius: 8, padding: '6px 14px',
        cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
      }}>
      {label}
    </button>
  );

  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 560 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>
          {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
        </h3>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          {tabBtn('personal', 'Datos Personales')}
          {tabBtn('laboral', 'Datos Laborales')}
          {tabBtn('fiscal', 'Fiscal / Banco')}
        </div>

        {/* Personal */}
        {activeTab === 'personal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Nombre completo *">
              <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                style={inputStyle} placeholder="Apellido Paterno Materno Nombres" />
            </Field>
            <div style={grid2}>
              <Field label="CURP">
                <input value={form.curp} onChange={(e) => set('curp', e.target.value.toUpperCase())}
                  style={inputStyle} maxLength={18} placeholder="AAAA######MMMMMM##" />
              </Field>
              <Field label="RFC">
                <input value={form.rfc} onChange={(e) => set('rfc', e.target.value.toUpperCase())}
                  style={inputStyle} maxLength={13} placeholder="AAAA######XXX" />
              </Field>
              <Field label="NSS (IMSS)">
                <input value={form.nss} onChange={(e) => set('nss', e.target.value)}
                  style={inputStyle} maxLength={11} placeholder="Número de Seguridad Social" />
              </Field>
              <Field label="Fecha de nacimiento">
                <input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Sexo">
                <select value={form.sex} onChange={(e) => set('sex', e.target.value as 'M' | 'F')} style={inputStyle}>
                  {SEXES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </Field>
              <Field label="Estado civil">
                <select value={form.maritalStatus || ''} onChange={(e) => set('maritalStatus', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Laboral */}
        {activeTab === 'laboral' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={grid2}>
              <Field label="Fecha de ingreso *">
                <input type="date" value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Estatus">
                <select value={form.status} onChange={(e) => set('status', e.target.value as Employee['status'])} style={inputStyle}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Puesto">
                <input value={form.position} onChange={(e) => set('position', e.target.value)}
                  style={inputStyle} placeholder="Ej. Auxiliar de eventos" />
              </Field>
              <Field label="Departamento">
                <input value={form.department} onChange={(e) => set('department', e.target.value)}
                  style={inputStyle} placeholder="Ej. Operaciones" />
              </Field>
              <Field label="Grupo nómina">
                <select value={form.group} onChange={(e) => set('group', e.target.value as Employee['group'])} style={inputStyle}>
                  {GROUPS.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
                </select>
              </Field>
              <Field label="Tipo de contrato">
                <select value={form.contractType} onChange={(e) => set('contractType', e.target.value as Employee['contractType'])} style={inputStyle}>
                  {CONTRACT_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Jornada">
                <select value={form.workdayType} onChange={(e) => set('workdayType', e.target.value as Employee['workdayType'])} style={inputStyle}>
                  {WORKDAYS.map((w) => <option key={w}>{w}</option>)}
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="Salario diario (MXN)">
                <input type="number" min="0" step="0.01" value={form.dailySalary || ''}
                  onChange={(e) => {
                    const daily = Number(e.target.value);
                    const sdi = Math.round(daily * 1.0452 * 100) / 100; // simplified SDI with 4.52% factor
                    const sbc = Math.min(sdi, 25 * 113.14); // capped at 25 UMAs (2025)
                    set('dailySalary', daily);
                    setForm((f) => ({ ...f, dailySalary: daily, sdi, sbc }));
                  }}
                  style={inputStyle} placeholder="0.00" />
              </Field>
              <Field label="SDI (Salario Diario Integrado)">
                <input type="number" min="0" step="0.01" value={form.sdi || ''}
                  onChange={(e) => set('sdi', Number(e.target.value))}
                  style={inputStyle} placeholder="Auto-calculado" />
              </Field>
              <Field label="SBC (Sal. Base Cotización)">
                <input type="number" min="0" step="0.01" value={form.sbc || ''}
                  onChange={(e) => set('sbc', Number(e.target.value))}
                  style={inputStyle} placeholder="Auto-calculado" />
              </Field>
            </div>
            <div style={{ background: C.card, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.textDim }}>
              SDI y SBC se estiman automáticamente al ingresar el salario diario (SDI = salario × 1.0452, SBC ≤ 25 UMAs). Ajusta manualmente si aplica.
            </div>
          </div>
        )}

        {/* Fiscal / Banco */}
        {activeTab === 'fiscal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={grid2}>
              <Field label="Banco">
                <input value={form.bank || ''} onChange={(e) => set('bank', e.target.value)}
                  style={inputStyle} placeholder="Ej. BBVA, Banamex…" />
              </Field>
              <Field label="CLABE interbancaria">
                <input value={form.clabe || ''} onChange={(e) => set('clabe', e.target.value)}
                  style={inputStyle} maxLength={18} placeholder="18 dígitos" />
              </Field>
            </div>
            <div style={{ background: C.card, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.textDim }}>
              La CLABE se usa para generar el layout SPEI al aprobar la nómina.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Guardando…' : employee ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
