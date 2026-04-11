import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Supplier, ClientContact } from '@/types';

function rowToSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    tradeName: (row.trade_name as string) || '',
    legalName: row.legal_name as string | undefined,
    rfc: row.rfc as string | undefined,
    category: (row.category as string) || '',
    contact: row.contact as ClientContact | undefined,
    paymentTerms: row.payment_terms as string | undefined,
    rating: row.rating as number | undefined,
    documents: row.documents as Record<string, string> | undefined,
    createdAt: (row.created_at as string) || '',
  };
}

function supplierToRow(s: Partial<Supplier>) {
  const row: Record<string, unknown> = {};
  if (s.tradeName !== undefined) row.trade_name = s.tradeName;
  if (s.legalName !== undefined) row.legal_name = s.legalName;
  if (s.rfc !== undefined) row.rfc = s.rfc;
  if (s.category !== undefined) row.category = s.category;
  if (s.contact !== undefined) row.contact = s.contact;
  if (s.paymentTerms !== undefined) row.payment_terms = s.paymentTerms;
  if (s.rating !== undefined) row.rating = s.rating;
  if (s.documents !== undefined) row.documents = s.documents;
  return row;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('trade_name');
      if (error) throw error;
      return (data || []).map(rowToSupplier);
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Omit<Supplier, 'id' | 'createdAt'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase.from('suppliers').insert({ id, ...supplierToRow(s) }).select().single();
      if (error) throw error;
      return rowToSupplier(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase.from('suppliers').update(supplierToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
