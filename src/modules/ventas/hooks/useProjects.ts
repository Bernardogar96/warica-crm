import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    opportunityId: (row.opportunity_id as string) || '',
    clientId: (row.client_id as string) || '',
    businessUnit: (row.business_unit as string) || '',
    projectName: (row.project_name as string) || '',
    serviceType: (row.service_type as string) || '',
    amount: Number(row.amount) || 0,
    status: (row.status as Project['status']) || 'activo',
    startDate: row.start_date as string | undefined,
    endDate: row.end_date as string | undefined,
    completedAt: row.completed_at as string | undefined,
    createdAt: (row.created_at as string) || '',
  };
}

function projectToRow(p: Partial<Project>) {
  const row: Record<string, unknown> = {};
  if (p.opportunityId !== undefined) row.opportunity_id = p.opportunityId;
  if (p.clientId !== undefined) row.client_id = p.clientId;
  if (p.businessUnit !== undefined) row.business_unit = p.businessUnit;
  if (p.projectName !== undefined) row.project_name = p.projectName;
  if (p.serviceType !== undefined) row.service_type = p.serviceType;
  if (p.amount !== undefined) row.amount = p.amount;
  if (p.status !== undefined) row.status = p.status;
  if (p.startDate !== undefined) row.start_date = p.startDate;
  if (p.endDate !== undefined) row.end_date = p.endDate;
  if (p.completedAt !== undefined) row.completed_at = p.completedAt;
  return row;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToProject);
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Project, 'id' | 'createdAt'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from('projects').insert({ id, ...projectToRow(p) }).select().single();
      if (error) throw error;
      return rowToProject(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from('projects').update(projectToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
