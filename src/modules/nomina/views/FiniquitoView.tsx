import { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { calcFiniquito } from '../lib/calculations';
import { C, h2Style, inputStyle, btnPrimary } from '@/styles/theme';
import type { Employee } from '@/types';
import type { FiniquitoResult } from '../lib/calculations';

const SEPARATION_TYPES = [
  { value: 'renuncia', label: 'Renuncia voluntaria' },
  { value: 'despido_justificado', label: 'Despido justificado' },
  { value: 'despido_injustificado', label: 'Despido injustificado (liquidación)' },
] as const;

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export function FiniquitoView() {
  const { data: employees = [] } = useEmployees();
  const [selectedId, setSelectedId] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [separationType, setSeparationType] = useState<'renuncia' | 'despido_justificado' | 'despido_injustificado'>('renuncia');
  const [vacationsTaken, setVacationsTaken] = useState(0);
  const [salariosPendientes, setSalariosPendientes] = useState(0);
  const [result, setResult] = useState<FiniquitoResult | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedId);

  const calculate = () => {
    if (!selectedEmployee || !terminationDate) return;
    const res = calcFiniquito({
      dailySalary: selectedEmployee.dailySalary,
      hireDate: selectedEmployee.hireDate,
      terminationDate,
      separationType,
      vacationDaysAccrued: 0,
      vacationDaysTaken: vacationsTaken,
    });
    // Add salarios pendientes manually
    res.salariosPendientes = salariosPendientes;
    res.total = Math.round((res.total + salariosPendientes) * 100) / 100;
    if (salariosPendientes > 0) {
      res.lines.unshift({ label: 'Salarios pendientes de pago', amount: salariosPendientes });
    }
    setResult(res);
  };

  const seniority = selectedEmployee
    ? Math.floor((new Date(terminationDate || new Date().toISOString().slice(0, 10)).getTime() - new Date(selectedEmployee.hireDate).getTime()) / (86400000 * 365))
    : 0;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ ...h2Style, marginBottom: 24 }}>Calculadora de Finiquito / Liquidación</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Inputs */}
        <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Datos del empleado
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>Empleado</div>
              <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
                style={inputStyle}>
                <option value="">— Seleccionar —</option>
                {employees.filter((e) => e.status !== 'baja').map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <div style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                <div style={{ color: C.textDim }}>Ingreso: <span style={{ color: C.text }}>{selectedEmployee.hireDate}</span></div>
                <div style={{ color: C.textDim }}>Sal. diario: <span style={{ color: C.text, fontFamily: 'Space Mono' }}>{fmt(selectedEmployee.dailySalary)}</span></div>
                <div style={{ color: C.textDim }}>Antigüedad: <span style={{ color: C.text }}>{seniority} años</span></div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>Fecha de baja</div>
              <input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)}
                style={inputStyle} />
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>Tipo de separación</div>
              <select value={separationType} onChange={(e) => setSeparationType(e.target.value as typeof separationType)}
                style={inputStyle}>
                {SEPARATION_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>Días de vacaciones disfrutados</div>
              <input type="number" min="0" value={vacationsTaken}
                onChange={(e) => setVacationsTaken(Number(e.target.value))}
                style={inputStyle} />
            </div>

            <div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>Salarios pendientes de pago (MXN)</div>
              <input type="number" min="0" step="0.01" value={salariosPendientes}
                onChange={(e) => setSalariosPendientes(Number(e.target.value))}
                style={inputStyle} />
            </div>

            <button onClick={calculate} disabled={!selectedEmployee || !terminationDate}
              style={btnPrimary}>
              Calcular
            </button>
          </div>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Desglose del finiquito
              </div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>
                Antigüedad: <span style={{ color: C.text }}>{result.diasTrabajados} días trabajados</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {result.lines.map((line, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ fontSize: 13, color: C.text }}>{line.label}</span>
                    <span style={{ fontFamily: 'Space Mono', fontSize: 13, color: C.accent }}>
                      {fmt(line.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 16, paddingTop: 12, borderTop: `2px solid ${C.accent}`,
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Total a pagar</span>
                <span style={{ fontFamily: 'Space Mono', fontSize: 20, fontWeight: 700, color: '#4ade80' }}>
                  {fmt(result.total)}
                </span>
              </div>

              <div style={{ marginTop: 12, background: C.warnDim, border: `1px solid ${C.warn}40`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: C.warn }}>
                Este cálculo es orientativo (LFT mínimos). Verificar con el expediente del empleado y el IMSS antes de firmar el finiquito.
              </div>

              <button onClick={() => window.print()} style={{ marginTop: 12, width: '100%', padding: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                Imprimir
              </button>
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 12, padding: 40, textAlign: 'center', border: `1px solid ${C.border}`, color: C.textDim, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 32 }}>🧮</div>
              <div style={{ fontSize: 13 }}>Completa los datos y presiona <b>Calcular</b></div>
            </div>
          )}
        </div>
      </div>

      {/* Legal note */}
      <div style={{ background: C.card, borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.textDim, border: `1px solid ${C.border}` }}>
        <b style={{ color: C.text }}>Conceptos incluidos:</b> Aguinaldo proporcional (15 días × año), vacaciones pendientes (LFT), prima vacacional (25%), y para despido injustificado: 20 días × año + 3 meses (Art. 50 LFT). No incluye partes proporcionales del salario variable ni retenciones de ISR sobre liquidación (ISR Art. 93).
      </div>
    </div>
  );
}
