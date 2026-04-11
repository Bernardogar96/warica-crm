import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceConcept } from '@/types';

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    projectId: (row.project_id as string) || '',
    clientId: (row.client_id as string) || '',
    folio: row.folio as string | undefined,
    concepts: (row.concepts as InvoiceConcept[]) || [],
    subtotal: Number(row.subtotal) || 0,
    iva: Number(row.iva) || 0,
    total: Number(row.total) || 0,
    status: (row.status as Invoice['status']) || 'borrador',
    issuedAt: row.issued_at as string | undefined,
    dueDate: row.due_date as string | undefined,
    paidAt: row.paid_at as string | undefined,
    paymentNotes: row.payment_notes as string | undefined,
    cfdiUuid: row.cfdi_uuid as string | undefined,
    cfdiSeal: row.cfdi_seal as string | undefined,
    cfdiChain: row.cfdi_chain as string | undefined,
    cfdiPacName: row.cfdi_pac_name as string | undefined,
    cfdiXmlUrl: row.cfdi_xml_url as string | undefined,
    cfdiPdfUrl: row.cfdi_pdf_url as string | undefined,
    createdAt: (row.created_at as string) || '',
  };
}

function invoiceToRow(inv: Partial<Invoice>) {
  const row: Record<string, unknown> = {};
  if (inv.projectId !== undefined) row.project_id = inv.projectId;
  if (inv.clientId !== undefined) row.client_id = inv.clientId;
  if (inv.folio !== undefined) row.folio = inv.folio;
  if (inv.concepts !== undefined) row.concepts = inv.concepts;
  if (inv.subtotal !== undefined) row.subtotal = inv.subtotal;
  if (inv.iva !== undefined) row.iva = inv.iva;
  if (inv.total !== undefined) row.total = inv.total;
  if (inv.status !== undefined) row.status = inv.status;
  if (inv.issuedAt !== undefined) row.issued_at = inv.issuedAt;
  if (inv.dueDate !== undefined) row.due_date = inv.dueDate;
  if (inv.paidAt !== undefined) row.paid_at = inv.paidAt;
  if (inv.paymentNotes !== undefined) row.payment_notes = inv.paymentNotes;
  if (inv.cfdiUuid !== undefined) row.cfdi_uuid = inv.cfdiUuid;
  return row;
}

export function useInvoices(projectId?: string) {
  return useQuery({
    queryKey: ['invoices', projectId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(rowToInvoice);
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inv: Omit<Invoice, 'id' | 'createdAt'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from('invoices').insert({ id, ...invoiceToRow(inv) }).select().single();
      if (error) throw error;
      return rowToInvoice(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Invoice> & { id: string }) => {
      const { error } = await supabase.from('invoices').update(invoiceToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
