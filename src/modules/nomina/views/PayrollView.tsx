import { useState } from 'react';
import { usePayrollPeriods, useCreatePayrollPeriod } from '../hooks/usePayroll';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import { C, h2Style, inputStyle, btnPrimary, btnSecondary, tdStyle } from '@/styles/theme';
import type { PayrollPeriod } from '@/types';

const PERIOD_LABELS: Record<PayrollPeriod['periodType'], string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

const STATUS_COLOR: Record<PayrollPeriod['status'], string> = {
  draft: '#f59e0b',
  approved: '#60a5fa',
  paid: '#4ade80',
};

const STATUS_LABEL: Record<PayrollPeriod['status'], string> = {
  draft: 'Borrador',
  approved: 'Aprobada',
  paid: 'Pagada',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

interface NewPeriodFormProps {
  onSave: (data: Omit<PayrollPeriod, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

function NewPeriodForm({ onSave, onClose }: NewPeriodFormProps) {
  const [form, setForm] = useState({
    periodType: 'biweekly' as PayrollPeriod['periodType'],
    startDate: '',
    endDate: '',
    group: 'all' as PayrollPeriod['group'],
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        status: 'draft',
        totalGross: 0,
        totalNet: 0,
        totalImssEmployer: 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 420 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Nueva Nómina</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Tipo de período">
              <select value={form.periodType}
                onChange={(e) => setForm((f) => ({ ...f, periodType: e.target.value as PayrollPeriod['periodType'] }))}
                style={inputStyle}>
                <option value="weekly">Semanal (7 días)</option>
                <option value="biweekly">Quincenal (15 días)</option>
                <option value="monthly">Mensual (30 días)</option>
              </select>
            </Field>
            <Field label="Grupo">
              <select value={form.group}
                onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as PayrollPeriod['group'] }))}
                style={inputStyle}>
                <option value="all">Todos</option>
                <option value="A">Grupo A</option>
                <option value="B">Grupo B</option>
                <option value="C">Grupo C</option>
              </select>
            </Field>
            <Field label="Fecha inicio">
              <input type="date" value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                style={inputStyle} />
            </Field>
            <Field label="Fecha fin">
              <input type="date" value={form.endDate} min={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Creando…' : 'Crear nómina'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

interface Props {
  onSelectPeriod: (id: string) => void;
}

export function PayrollView({ onSelectPeriod }: Props) {
  const { data: periods = [], isLoading } = usePayrollPeriods();
  const createPeriod = useCreatePayrollPeriod();
  const [showNew, setShowNew] = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Períodos de Nómina</h2>
        <button onClick={() => setShowNew(true)} style={{ ...btnPrimary, fontSize: 13 }}>
          + Nueva nómina
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando…</div>
      ) : periods.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>Sin nóminas registradas</div>
          <button onClick={() => setShowNew(true)} style={btnPrimary}>Crear primera nómina</button>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Período', 'Tipo', 'Grupo', 'Estatus', 'Total Bruto', 'Total Neto', 'IMSS Patronal'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id}
                  onClick={() => onSelectPeriod(p.id)}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{p.startDate} — {p.endDate}</div>
                  </td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{PERIOD_LABELS[p.periodType]}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{p.group === 'all' ? 'Todos' : `Grupo ${p.group}`}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, borderRadius: 6, padding: '2px 8px',
                      background: STATUS_COLOR[p.status] + '20', color: STATUS_COLOR[p.status],
                    }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12 }}>{fmt(p.totalGross)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: '#4ade80' }}>{fmt(p.totalNet)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: C.textDim }}>{fmt(p.totalImssEmployer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewPeriodForm
          onSave={(data) => createPeriod.mutateAsync(data)}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}
