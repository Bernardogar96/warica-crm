import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Employee } from '@/types';

function rowToEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    curp: (row.curp as string) || '',
    rfc: (row.rfc as string) || '',
    nss: (row.nss as string) || '',
    fullName: (row.full_name as string) || '',
    birthDate: (row.birth_date as string) || '',
    sex: (row.sex as 'M' | 'F') || 'M',
    maritalStatus: row.marital_status as string | undefined,
    hireDate: (row.hire_date as string) || '',
    contractType: (row.contract_type as Employee['contractType']) || 'indeterminado',
    group: (row.group as Employee['group']) || 'A',
    position: (row.position as string) || '',
    department: (row.department as string) || '',
    workdayType: (row.workday_type as Employee['workdayType']) || 'completa',
    dailySalary: Number(row.daily_salary) || 0,
    sdi: Number(row.sdi) || 0,
    sbc: Number(row.sbc) || 0,
    bank: row.bank as string | undefined,
    clabe: row.clabe as string | undefined,
    status: (row.status as Employee['status']) || 'activo',
    createdAt: (row.created_at as string) || '',
  };
}

function employeeToRow(e: Partial<Employee>) {
  const row: Record<string, unknown> = {};
  if (e.curp !== undefined) row.curp = e.curp;
  if (e.rfc !== undefined) row.rfc = e.rfc;
  if (e.nss !== undefined) row.nss = e.nss;
  if (e.fullName !== undefined) row.full_name = e.fullName;
  if (e.birthDate !== undefined) row.birth_date = e.birthDate;
  if (e.sex !== undefined) row.sex = e.sex;
  if (e.maritalStatus !== undefined) row.marital_status = e.maritalStatus;
  if (e.hireDate !== undefined) row.hire_date = e.hireDate;
  if (e.contractType !== undefined) row.contract_type = e.contractType;
  if (e.group !== undefined) row.group = e.group;
  if (e.position !== undefined) row.position = e.position;
  if (e.department !== undefined) row.department = e.department;
  if (e.workdayType !== undefined) row.workday_type = e.workdayType;
  if (e.dailySalary !== undefined) row.daily_salary = e.dailySalary;
  if (e.sdi !== undefined) row.sdi = e.sdi;
  if (e.sbc !== undefined) row.sbc = e.sbc;
  if (e.bank !== undefined) row.bank = e.bank;
  if (e.clabe !== undefined) row.clabe = e.clabe;
  if (e.status !== undefined) row.status = e.status;
  return row;
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('full_name');
      if (error) throw error;
      return (data || []).map(rowToEmployee);
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emp: Omit<Employee, 'id' | 'createdAt'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from('employees').insert({ id, ...employeeToRow(emp) }).select().single();
      if (error) throw error;
      return rowToEmployee(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase.from('employees').update(employeeToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}
