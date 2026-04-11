import { useState, useEffect } from 'react';
import { usePayrollPeriod, usePayrollEntries, useUpdatePayrollPeriod, useUpsertPayrollEntries } from '../hooks/usePayroll';
import { useEmployees } from '../hooks/useEmployees';
import { calcPayrollEntry, ISR_TABLE_2025, SUBSIDY_TABLE_2025, UMA_DIARIO_2025 } from '../lib/calculations';
import { buildSpeiCsv, buildSuaCsv, downloadCsv, buildPayStubHtml, printPayStub } from '../lib/exports';
import { C, h2Style, btnPrimary, btnSecondary, btnSmall, inputStyle } from '@/styles/theme';
import type { Employee, PayrollEntry, PayrollPeriod } from '@/types';

const STATUS_LABEL: Record<PayrollPeriod['status'], string> = {
  draft: 'Borrador', approved: 'Aprobada', paid: 'Pagada',
};

function periodDays(type: PayrollPeriod['periodType']): number {
  return type === 'weekly' ? 7 : type === 'biweekly' ? 15 : 30;
}

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const thStyle: React.CSSProperties = {
  padding: '8px 10px', color: '#888', fontWeight: 500, fontSize: 10,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a',
  textAlign: 'left', whiteSpace: 'nowrap',
};

interface Props {
  periodId: string;
  onBack: () => void;
}

export function PayrollDetail({ periodId, onBack }: Props) {
  const { data: period } = usePayrollPeriod(periodId);
  const { data: existingEntries = [] } = usePayrollEntries(periodId);
  const { data: employees = [] } = useEmployees();
  const updatePeriod = useUpdatePayrollPeriod();
  const upsertEntries = useUpsertPayrollEntries();

  // Local working copy of entries
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Build / refresh entries when data loads
  useEffect(() => {
    if (!period || employees.length === 0) return;

    const days = periodDays(period.periodType);
    const eligible = period.group === 'all'
      ? employees.filter((e) => e.status === 'activo')
      : employees.filter((e) => e.status === 'activo' && e.group === period.group);

    const built: PayrollEntry[] = eligible.map((emp) => {
      const existing = existingEntries.find((x) => x.employeeId === emp.id);
      if (existing) return existing;

      const calc = calcPayrollEntry(emp, days, days, ISR_TABLE_2025, SUBSIDY_TABLE_2025, UMA_DIARIO_2025);
      return {
        id: crypto.randomUUID(),
        periodId,
        employeeId: emp.id,
        daysWorked: calc.daysWorked,
        grossSalary: calc.grossSalary,
        overtimeHours: 0,
        overtimeAmount: 0,
        perceptions: {},
        deductions: {},
        netSalary: calc.netSalary,
        imssEmployee: calc.imssObrero,
        imssEmployer: calc.imssPatron,
        isrWithheld: calc.isrWithheld,
        subsidyApplied: calc.subsidyApplied,
      };
    });
    setEntries(built);
    setDirty(existingEntries.length === 0);
  }, [period, employees, existingEntries, periodId]);

  const updateDays = (empId: string, days: number) => {
    if (!period) return;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const pDays = periodDays(period.periodType);
    const calc = calcPayrollEntry(emp, days, pDays, ISR_TABLE_2025, SUBSIDY_TABLE_2025, UMA_DIARIO_2025);
    setEntries((prev) => prev.map((e) =>
      e.employeeId === empId
        ? { ...e, daysWorked: days, grossSalary: calc.grossSalary, netSalary: calc.netSalary, imssEmployee: calc.imssObrero, imssEmployer: calc.imssPatron, isrWithheld: calc.isrWithheld, subsidyApplied: calc.subsidyApplied }
        : e,
    ));
    setDirty(true);
  };

  const totalGross = entries.reduce((s, e) => s + e.grossSalary, 0);
  const totalNet = entries.reduce((s, e) => s + e.netSalary, 0);
  const totalImssPatron = entries.reduce((s, e) => s + e.imssEmployer, 0);
  const totalImssObrero = entries.reduce((s, e) => s + e.imssEmployee, 0);
  const totalIsr = entries.reduce((s, e) => s + e.isrWithheld, 0);

  const handleSave = async () => {
    if (!period) return;
    setSaving(true);
    try {
      await upsertEntries.mutateAsync(entries);
      await updatePeriod.mutateAsync({
        id: period.id, totalGross, totalNet, totalImssEmployer: totalImssPatron,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!period || dirty) return;
    if (!confirm('¿Aprobar nómina? Ya no se podrán editar los importes.')) return;
    await updatePeriod.mutateAsync({ id: period.id, status: 'approved' });
  };

  const handleMarkPaid = async () => {
    if (!period) return;
    if (!confirm('¿Marcar nómina como pagada?')) return;
    await updatePeriod.mutateAsync({ id: period.id, status: 'paid' });
  };

  if (!period) return <div style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando…</div>;

  const isDraft = period.status === 'draft';
  const isApproved = period.status === 'approved';
  const pDays = periodDays(period.periodType);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}>← Nóminas</button>
        <h2 style={{ ...h2Style, margin: 0, flex: 1 }}>
          Nómina {period.startDate} — {period.endDate}
        </h2>
        <span style={{
          fontSize: 11, borderRadius: 6, padding: '3px 10px',
          background: { draft: '#f59e0b', approved: '#60a5fa', paid: '#4ade80' }[period.status] + '20',
          color: { draft: '#f59e0b', approved: '#60a5fa', paid: '#4ade80' }[period.status],
        }}>
          {STATUS_LABEL[period.status]}
        </span>
        <span style={{ fontSize: 12, color: C.textDim }}>
          {period.group === 'all' ? 'Todos los grupos' : `Grupo ${period.group}`} · {pDays} días
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Bruto', value: fmt(totalGross), color: C.accent },
          { label: 'Total Neto', value: fmt(totalNet), color: '#4ade80' },
          { label: 'IMSS Obrero', value: fmt(totalImssObrero), color: '#60a5fa' },
          { label: 'ISR Retenido', value: fmt(totalIsr), color: '#f87171' },
          { label: 'IMSS Patronal', value: fmt(totalImssPatron), color: '#f59e0b' },
          { label: 'Empleados', value: String(entries.length), color: C.textDim },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.card, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Mono', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {isDraft && (
          <>
            <button onClick={handleSave} disabled={!dirty || saving} style={btnPrimary}>
              {saving ? 'Guardando…' : 'Guardar cálculos'}
            </button>
            <button onClick={handleApprove} disabled={dirty} style={{ ...btnSecondary, fontSize: 13 }}>
              Aprobar nómina
            </button>
          </>
        )}
        {isApproved && (
          <button onClick={handleMarkPaid} style={{ ...btnPrimary, background: '#4ade80', color: '#000' }}>
            Marcar como pagada
          </button>
        )}
        <button onClick={() => downloadCsv(buildSpeiCsv(entries, employees, period), `spei_${period.startDate}.csv`)}
          style={{ ...btnSecondary, fontSize: 12 }}>
          Exportar SPEI
        </button>
        <button onClick={() => downloadCsv(buildSuaCsv(entries, employees, period), `sua_${period.startDate}.csv`)}
          style={{ ...btnSecondary, fontSize: 12 }}>
          Exportar SUA
        </button>
      </div>

      {/* Entries table */}
      <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.surface }}>
              {['Empleado', 'Grupo', 'Días', 'Salario Bruto', 'IMSS Obrero', 'ISR', 'Subsidio', 'Neto', ''].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const emp = employees.find((e) => e.id === entry.employeeId);
              if (!emp) return null;
              return (
                <tr key={entry.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 10px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 600, color: C.text }}>{emp.fullName}</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>{emp.position}</div>
                  </td>
                  <td style={{ padding: '10px 10px', color: C.textDim, fontSize: 12 }}>{emp.group}</td>
                  <td style={{ padding: '10px 10px' }}>
                    {isDraft ? (
                      <input type="number" min="0" max={pDays} value={entry.daysWorked}
                        onChange={(e) => updateDays(emp.id, Number(e.target.value))}
                        style={{ ...inputStyle, width: 60, padding: '4px 6px', textAlign: 'center', fontFamily: 'Space Mono', fontSize: 12 }} />
                    ) : (
                      <span style={{ fontFamily: 'Space Mono' }}>{entry.daysWorked}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Space Mono', color: C.accent }}>{fmt(entry.grossSalary)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Space Mono', color: '#60a5fa' }}>{fmt(entry.imssEmployee)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Space Mono', color: '#f87171' }}>{fmt(entry.isrWithheld)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Space Mono', color: '#4ade80' }}>{fmt(entry.subsidyApplied)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'Space Mono', fontWeight: 700, color: '#4ade80' }}>{fmt(entry.netSalary)}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <button onClick={() => {
                      const html = buildPayStubHtml(entry, emp, period, 'Warica');
                      printPayStub(html);
                    }} style={{ ...btnSmall, fontSize: 10 }}>Recibo</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
