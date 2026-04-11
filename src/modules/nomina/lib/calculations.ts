import type { Employee, IsrBracket, SubsidyBracket } from '@/types';

/* ── 2025 Constants ── */
export const UMA_DIARIO_2025 = 113.14;
export const SMG_DIARIO_2025 = 278.80; // Salario mínimo general CDMX

/* ── ISR Table 2025 (monthly) — Art. 96 LISR ── */
export const ISR_TABLE_2025: IsrBracket[] = [
  { lowerLimit: 0.01,      upperLimit: 746.04,     fixedFee: 0.00,       rate: 0.0192 },
  { lowerLimit: 746.05,    upperLimit: 6332.05,    fixedFee: 14.32,      rate: 0.0640 },
  { lowerLimit: 6332.06,   upperLimit: 11128.01,   fixedFee: 371.83,     rate: 0.1088 },
  { lowerLimit: 11128.02,  upperLimit: 12935.82,   fixedFee: 893.63,     rate: 0.1600 },
  { lowerLimit: 12935.83,  upperLimit: 15487.71,   fixedFee: 1182.88,    rate: 0.1792 },
  { lowerLimit: 15487.72,  upperLimit: 31236.49,   fixedFee: 1640.18,    rate: 0.2136 },
  { lowerLimit: 31236.50,  upperLimit: 49233.00,   fixedFee: 5004.12,    rate: 0.2352 },
  { lowerLimit: 49233.01,  upperLimit: 93993.90,   fixedFee: 9236.89,    rate: 0.3000 },
  { lowerLimit: 93993.91,  upperLimit: 125325.20,  fixedFee: 22665.17,   rate: 0.3200 },
  { lowerLimit: 125325.21, upperLimit: 375975.61,  fixedFee: 32691.18,   rate: 0.3400 },
  { lowerLimit: 375975.62, upperLimit: Infinity,   fixedFee: 117912.32,  rate: 0.3500 },
];

/* ── Subsidy Table 2025 (monthly) ── */
export const SUBSIDY_TABLE_2025: SubsidyBracket[] = [
  { lowerLimit: 0.01,    upperLimit: 1768.96, subsidy: 407.02 },
  { lowerLimit: 1768.97, upperLimit: 2653.38, subsidy: 406.83 },
  { lowerLimit: 2653.39, upperLimit: 3472.84, subsidy: 406.62 },
  { lowerLimit: 3472.85, upperLimit: 3537.87, subsidy: 392.77 },
  { lowerLimit: 3537.88, upperLimit: 4446.15, subsidy: 382.46 },
  { lowerLimit: 4446.16, upperLimit: 4717.18, subsidy: 354.23 },
  { lowerLimit: 4717.19, upperLimit: 5335.42, subsidy: 324.87 },
  { lowerLimit: 5335.43, upperLimit: 6224.67, subsidy: 294.63 },
  { lowerLimit: 6224.68, upperLimit: 7113.90, subsidy: 253.54 },
  { lowerLimit: 7113.91, upperLimit: 7382.33, subsidy: 217.61 },
  { lowerLimit: 7382.34, upperLimit: Infinity, subsidy: 0.00 },
];

function r2(n: number) { return Math.round(n * 100) / 100; }

/* ── ISR ── */

function isrMonthlyRaw(
  gross: number,
  isrTable: IsrBracket[],
  subsidyTable: SubsidyBracket[],
) {
  if (gross <= 0) return { isr: 0, subsidy: 0, isrNet: 0 };
  const b = isrTable.find((x) => gross >= x.lowerLimit && gross <= x.upperLimit)
    ?? isrTable[isrTable.length - 1];
  const isr = b.fixedFee + (gross - b.lowerLimit) * b.rate;
  const sub = subsidyTable.find((x) => gross >= x.lowerLimit && gross <= x.upperLimit)?.subsidy ?? 0;
  return { isr, subsidy: sub, isrNet: Math.max(0, isr - sub) };
}

/** ISR withheld for a sub-monthly period (gross = amount earned in that period) */
export function calcIsrForPeriod(
  grossForPeriod: number,
  periodDays: number,
  isrTable: IsrBracket[] = ISR_TABLE_2025,
  subsidyTable: SubsidyBracket[] = SUBSIDY_TABLE_2025,
) {
  const factor = 30 / periodDays;
  const monthly = grossForPeriod * factor;
  const { isr, subsidy, isrNet } = isrMonthlyRaw(monthly, isrTable, subsidyTable);
  return {
    isr: r2(isr / factor),
    subsidy: r2(subsidy / factor),
    isrNet: r2(isrNet / factor),
  };
}

/* ── IMSS Obrero ── */
export function calcImssObrero(
  sbc: number, // daily SBC
  daysWorked: number,
  uma: number = UMA_DIARIO_2025,
) {
  const sbcP = sbc * daysWorked;
  const umaP = uma * daysWorked;
  const excedente = Math.max(0, sbcP - 3 * umaP);
  return r2(
    excedente * 0.004 +
    sbcP * 0.00375 +  // pensionados
    sbcP * 0.00625 +  // invalidez y vida
    sbcP * 0.01125,   // cesantía y vejez
  );
}

/* ── IMSS Patronal ── */
export function calcImssPatron(
  sbc: number, // daily SBC
  daysWorked: number,
  uma: number = UMA_DIARIO_2025,
) {
  const sbcP = sbc * daysWorked;
  const umaP = uma * daysWorked;
  const excedente = Math.max(0, sbcP - 3 * umaP);
  return r2(
    umaP * 0.204 +    // E&M cuota fija sobre 1 UMA diaria × days
    excedente * 0.011 +
    sbcP * 0.0105 +   // pensionados
    sbcP * 0.0175 +   // invalidez y vida
    sbcP * 0.01 +     // guarderías
    sbcP * 0.035 +    // cesantía y vejez
    sbcP * 0.05 +     // INFONAVIT
    sbcP * 0.02,      // SAR
  );
}

/* ── Full Entry Calculation ── */
export interface PayrollCalcResult {
  grossSalary: number;
  daysWorked: number;
  imssObrero: number;
  imssPatron: number;
  isrWithheld: number;
  subsidyApplied: number;
  netSalary: number;
}

export function calcPayrollEntry(
  employee: Employee,
  daysWorked: number,
  periodDays: number,
  isrTable: IsrBracket[] = ISR_TABLE_2025,
  subsidyTable: SubsidyBracket[] = SUBSIDY_TABLE_2025,
  uma: number = UMA_DIARIO_2025,
): PayrollCalcResult {
  const sbc = employee.sbc || employee.sdi || employee.dailySalary;
  const grossSalary = r2(employee.dailySalary * daysWorked);
  const imssObrero = calcImssObrero(sbc, daysWorked, uma);
  const imssPatron = calcImssPatron(sbc, daysWorked, uma);
  const taxableBase = Math.max(0, grossSalary - imssObrero);
  const { isrNet, subsidy } = calcIsrForPeriod(taxableBase, periodDays, isrTable, subsidyTable);
  const netSalary = r2(grossSalary - imssObrero - isrNet);
  return {
    grossSalary,
    daysWorked,
    imssObrero,
    imssPatron,
    isrWithheld: isrNet,
    subsidyApplied: subsidy,
    netSalary,
  };
}

/* ── Finiquito ── */
export interface FiniquitoInput {
  dailySalary: number;
  hireDate: string;
  terminationDate: string;
  separationType: 'renuncia' | 'despido_justificado' | 'despido_injustificado';
  vacationDaysAccrued: number; // total days earned, not yet taken
  vacationDaysTaken: number;
}

export interface FiniquitoResult {
  diasTrabajados: number;
  salariosPendientes: number;
  aguinaldoProporcional: number;
  vacacionesPendientes: number;
  primaVacacional: number;
  indemnizacion20dias: number;
  tresMeses: number;
  total: number;
  lines: { label: string; amount: number }[];
}

export function calcFiniquito(input: FiniquitoInput): FiniquitoResult {
  const { dailySalary, hireDate, terminationDate, separationType, vacationDaysTaken } = input;

  const hire = new Date(hireDate);
  const term = new Date(terminationDate);
  const msPerDay = 86400000;
  const totalDays = Math.max(0, Math.floor((term.getTime() - hire.getTime()) / msPerDay));
  const yearsWorked = totalDays / 365;

  // Días trabajados en el año en curso (para aguinaldo proporcional)
  const startOfYear = new Date(term.getFullYear(), 0, 1);
  const daysThisYear = Math.floor((term.getTime() - startOfYear.getTime()) / msPerDay) + 1;

  // Aguinaldo proporcional: 15 días de salario × (días trabajados en año / 365)
  const aguinaldoProporcional = r2(dailySalary * 15 * (daysThisYear / 365));

  // Vacaciones pendientes (LFT mínimo)
  const vacDaysEarned = getVacationDays(Math.floor(yearsWorked));
  const vacPending = Math.max(0, vacDaysEarned - vacationDaysTaken);
  const vacacionesPendientes = r2(dailySalary * vacPending);

  // Prima vacacional: 25% de vacaciones pendientes
  const primaVacacional = r2(vacacionesPendientes * 0.25);

  // Indemnización solo por despido injustificado
  const indemnizacion20dias = separationType === 'despido_injustificado'
    ? r2(dailySalary * 20 * yearsWorked)
    : 0;
  const tresMeses = separationType === 'despido_injustificado'
    ? r2(dailySalary * 90)
    : 0;

  const salariosPendientes = 0; // user adjusts separately

  const total = r2(
    salariosPendientes + aguinaldoProporcional + vacacionesPendientes +
    primaVacacional + indemnizacion20dias + tresMeses,
  );

  const lines = [
    { label: 'Aguinaldo proporcional', amount: aguinaldoProporcional },
    { label: `Vacaciones pendientes (${vacPending} días)`, amount: vacacionesPendientes },
    { label: 'Prima vacacional (25%)', amount: primaVacacional },
    ...(separationType === 'despido_injustificado' ? [
      { label: `Indemnización 20 días × ${yearsWorked.toFixed(2)} años`, amount: indemnizacion20dias },
      { label: '3 meses de salario (Art. 50 LFT)', amount: tresMeses },
    ] : []),
  ];

  return {
    diasTrabajados: totalDays,
    salariosPendientes,
    aguinaldoProporcional,
    vacacionesPendientes,
    primaVacacional,
    indemnizacion20dias,
    tresMeses,
    total,
    lines,
  };
}

function getVacationDays(yearsCompleted: number): number {
  if (yearsCompleted < 1) return 0;
  if (yearsCompleted < 2) return 12;
  if (yearsCompleted < 3) return 14;
  if (yearsCompleted < 4) return 16;
  if (yearsCompleted < 5) return 18;
  if (yearsCompleted < 6) return 20;
  if (yearsCompleted < 7) return 22;
  if (yearsCompleted < 10) return 22;
  if (yearsCompleted < 15) return 24;
  if (yearsCompleted < 20) return 26;
  if (yearsCompleted < 25) return 28;
  return 30;
}
