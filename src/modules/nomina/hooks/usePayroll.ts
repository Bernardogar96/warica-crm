import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PayrollPeriod, PayrollEntry } from '@/types';

/* ── Period mapping ── */
function rowToPeriod(row: Record<string, unknown>): PayrollPeriod {
  return {
    id: row.id as string,
    periodType: (row.period_type as PayrollPeriod['periodType']) || 'biweekly',
    startDate: (row.start_date as string) || '',
    endDate: (row.end_date as string) || '',
    group: (row.group as PayrollPeriod['group']) || 'all',
    status: (row.status as PayrollPeriod['status']) || 'draft',
    totalGross: Number(row.total_gross) || 0,
    totalNet: Number(row.total_net) || 0,
    totalImssEmployer: Number(row.total_imss_employer) || 0,
    createdAt: (row.created_at as string) || '',
  };
}

function periodToRow(p: Partial<PayrollPeriod>) {
  const row: Record<string, unknown> = {};
  if (p.periodType !== undefined) row.period_type = p.periodType;
  if (p.startDate !== undefined) row.start_date = p.startDate;
  if (p.endDate !== undefined) row.end_date = p.endDate;
  if (p.group !== undefined) row.group = p.group;
  if (p.status !== undefined) row.status = p.status;
  if (p.totalGross !== undefined) row.total_gross = p.totalGross;
  if (p.totalNet !== undefined) row.total_net = p.totalNet;
  if (p.totalImssEmployer !== undefined) row.total_imss_employer = p.totalImssEmployer;
  return row;
}

/* ── Entry mapping ── */
function rowToEntry(row: Record<string, unknown>): PayrollEntry {
  return {
    id: row.id as string,
    periodId: (row.period_id as string) || '',
    employeeId: (row.employee_id as string) || '',
    daysWorked: Number(row.days_worked) || 0,
    grossSalary: Number(row.gross_salary) || 0,
    overtimeHours: Number(row.overtime_hours) || 0,
    overtimeAmount: Number(row.overtime_amount) || 0,
    perceptions: (row.perceptions as Record<string, number>) || {},
    deductions: (row.deductions as Record<string, number>) || {},
    netSalary: Number(row.net_salary) || 0,
    imssEmployee: Number(row.imss_employee) || 0,
    imssEmployer: Number(row.imss_employer) || 0,
    isrWithheld: Number(row.isr_withheld) || 0,
    subsidyApplied: Number(row.subsidy_applied) || 0,
  };
}

function entryToRow(e: Partial<PayrollEntry>) {
  const row: Record<string, unknown> = {};
  if (e.periodId !== undefined) row.period_id = e.periodId;
  if (e.employeeId !== undefined) row.employee_id = e.employeeId;
  if (e.daysWorked !== undefined) row.days_worked = e.daysWorked;
  if (e.grossSalary !== undefined) row.gross_salary = e.grossSalary;
  if (e.overtimeHours !== undefined) row.overtime_hours = e.overtimeHours;
  if (e.overtimeAmount !== undefined) row.overtime_amount = e.overtimeAmount;
  if (e.perceptions !== undefined) row.perceptions = e.perceptions;
  if (e.deductions !== undefined) row.deductions = e.deductions;
  if (e.netSalary !== undefined) row.net_salary = e.netSalary;
  if (e.imssEmployee !== undefined) row.imss_employee = e.imssEmployee;
  if (e.imssEmployer !== undefined) row.imss_employer = e.imssEmployer;
  if (e.isrWithheld !== undefined) row.isr_withheld = e.isrWithheld;
  if (e.subsidyApplied !== undefined) row.subsidy_applied = e.subsidyApplied;
  return row;
}

/* ── Hooks ── */

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ['payroll_periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods').select('*').order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToPeriod);
    },
  });
}

export function usePayrollPeriod(id: string | null) {
  return useQuery({
    queryKey: ['payroll_periods', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods').select('*').eq('id', id!).single();
      if (error) throw error;
      return rowToPeriod(data);
    },
  });
}

export function usePayrollEntries(periodId: string | null) {
  return useQuery({
    queryKey: ['payroll_entries', periodId],
    enabled: !!periodId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_entries').select('*').eq('period_id', periodId!);
      if (error) throw error;
      return (data || []).map(rowToEntry);
    },
  });
}

export function useCreatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<PayrollPeriod, 'id' | 'createdAt'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from('payroll_periods').insert({ id, ...periodToRow(p) }).select().single();
      if (error) throw error;
      return rowToPeriod(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll_periods'] }),
  });
}

export function useUpdatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<PayrollPeriod> & { id: string }) => {
      const { error } = await supabase
        .from('payroll_periods').update(periodToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['payroll_periods'] });
      qc.invalidateQueries({ queryKey: ['payroll_periods', id] });
    },
  });
}

export function useUpsertPayrollEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: PayrollEntry[]) => {
      const rows = entries.map((e) => ({ id: e.id, ...entryToRow(e) }));
      const { error } = await supabase
        .from('payroll_entries').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: (_, entries) => {
      if (entries.length > 0) {
        qc.invalidateQueries({ queryKey: ['payroll_entries', entries[0].periodId] });
      }
    },
  });
}
