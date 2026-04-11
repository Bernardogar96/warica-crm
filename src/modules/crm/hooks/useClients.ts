import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/types';

const CLIENTS_KEY = ['clients'] as const;

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    tradeName: row.trade_name as string,
    legalName: row.legal_name as string | undefined,
    industry: row.industry as string | undefined,
    companySize: row.company_size as string | undefined,
    website: row.website as string | undefined,
    socialMedia: (row.social_media as Record<string, string>) || {},
    fiscalAddress: (row.fiscal_address as Client['fiscalAddress']) || undefined,
    operationalAddress: row.operational_address as string | undefined,
    phones: (row.phones as string[]) || [],
    emails: (row.emails as string[]) || [],
    contacts: (row.contacts as Client['contacts']) || [],
    rfc: row.rfc as string | undefined,
    taxRegime: row.tax_regime as string | undefined,
    cfdiUse: row.cfdi_use as string | undefined,
    invoiceEmail: row.invoice_email as string | undefined,
    paymentTerms: row.payment_terms as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function clientToRow(c: Partial<Client>) {
  return {
    trade_name: c.tradeName,
    legal_name: c.legalName || null,
    industry: c.industry || null,
    company_size: c.companySize || null,
    website: c.website || null,
    social_media: c.socialMedia || {},
    fiscal_address: c.fiscalAddress || {},
    operational_address: c.operationalAddress || null,
    phones: c.phones || [],
    emails: c.emails || [],
    contacts: c.contacts || [],
    rfc: c.rfc || null,
    tax_regime: c.taxRegime || null,
    cfdi_use: c.cfdiUse || null,
    invoice_email: c.invoiceEmail || null,
    payment_terms: c.paymentTerms || null,
    updated_at: new Date().toISOString(),
  };
}

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('trade_name');
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(rowToClient);
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return rowToClient(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientToRow(client))
        .select()
        .single();
      if (error) throw error;
      return rowToClient(data as Record<string, unknown>);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(clientToRow(client))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToClient(data as Record<string, unknown>);
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY });
      qc.invalidateQueries({ queryKey: ['clients', c.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}
