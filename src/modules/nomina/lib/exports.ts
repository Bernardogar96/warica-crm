import type { Employee, PayrollEntry, PayrollPeriod } from '@/types';

/* ── SPEI Layout (CSV for bank disbursement) ── */
export function buildSpeiCsv(
  entries: PayrollEntry[],
  employees: Employee[],
  period: PayrollPeriod,
): string {
  const header = 'CLABE,Nombre,Monto,Referencia,Concepto';
  const rows = entries.map((e) => {
    const emp = employees.find((x) => x.id === e.employeeId);
    if (!emp) return null;
    const clabe = emp.clabe || '';
    const name = emp.fullName.replace(/,/g, ' ');
    const amount = e.netSalary.toFixed(2);
    const ref = `NOM${period.startDate.replace(/-/g, '')}`;
    return `${clabe},${name},${amount},${ref},NOMINA`;
  }).filter(Boolean).join('\n');
  return `${header}\n${rows}`;
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── SUA-compatible Movimiento Afiliatorio (simplified IDSE layout) ── */
/**
 * Generates a simplified SUA-style text file for IMSS reporting.
 * Format: NSS | CURP | RFC | Name | SBC | Days | Period
 * (Full IDSE format requires IMSS-issued digital certificate — this is the pre-submission summary)
 */
export function buildSuaCsv(
  entries: PayrollEntry[],
  employees: Employee[],
  period: PayrollPeriod,
): string {
  const header = 'NSS,CURP,RFC,Nombre,SBC,Dias_Cotizados,Periodo_Inicio,Periodo_Fin,Cuota_Obrero,Cuota_Patronal';
  const rows = entries.map((e) => {
    const emp = employees.find((x) => x.id === e.employeeId);
    if (!emp) return null;
    return [
      emp.nss,
      emp.curp,
      emp.rfc,
      `"${emp.fullName}"`,
      emp.sbc.toFixed(2),
      e.daysWorked,
      period.startDate,
      period.endDate,
      e.imssEmployee.toFixed(2),
      e.imssEmployer.toFixed(2),
    ].join(',');
  }).filter(Boolean).join('\n');
  return `${header}\n${rows}`;
}

/* ── Pay Stub HTML (print-ready) ── */
export function buildPayStubHtml(
  entry: PayrollEntry,
  employee: Employee,
  period: PayrollPeriod,
  companyName: string,
): string {
  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const perceptions = Object.entries(entry.perceptions || {});
  const deductions = Object.entries(entry.deductions || {});

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Recibo de Nómina</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #f0f0f0; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .total { font-weight: bold; font-size: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
</style></head><body>
<div class="header">
  <div><h1>${companyName}</h1><div>Recibo de Nómina — ${period.startDate} al ${period.endDate}</div></div>
  <div style="text-align:right"><div><b>${employee.fullName}</b></div>
    <div>${employee.position} | Grupo ${employee.group}</div>
    <div>NSS: ${employee.nss}</div><div>RFC: ${employee.rfc}</div>
  </div>
</div>
<div class="grid">
  <div>
    <table><thead><tr><th colspan="2">Percepciones</th></tr></thead><tbody>
      <tr><td>Salario ordinario</td><td>${fmt(entry.grossSalary)}</td></tr>
      ${perceptions.map(([k, v]) => `<tr><td>${k}</td><td>${fmt(v as number)}</td></tr>`).join('')}
      <tr class="total"><td>Total percepciones</td><td>${fmt(entry.grossSalary + (entry.overtimeAmount || 0))}</td></tr>
    </tbody></table>
  </div>
  <div>
    <table><thead><tr><th colspan="2">Deducciones</th></tr></thead><tbody>
      <tr><td>IMSS obrero</td><td>${fmt(entry.imssEmployee)}</td></tr>
      <tr><td>ISR</td><td>${fmt(entry.isrWithheld)}</td></tr>
      <tr><td>Subsidio al empleo</td><td>-${fmt(entry.subsidyApplied)}</td></tr>
      ${deductions.map(([k, v]) => `<tr><td>${k}</td><td>${fmt(v as number)}</td></tr>`).join('')}
      <tr class="total"><td>Total deducciones</td><td>${fmt(entry.imssEmployee + entry.isrWithheld - entry.subsidyApplied)}</td></tr>
    </tbody></table>
  </div>
</div>
<div style="text-align:right; font-size:16px; font-weight:bold; margin-top:8px; border-top:2px solid #333; padding-top:8px;">
  Neto a pagar: ${fmt(entry.netSalary)}
</div>
</body></html>`;
}

export function printPayStub(html: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.print();
}
