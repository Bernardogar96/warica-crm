import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PurchaseRequest, PurchaseQuote, PurchaseOrder } from '@/types';

/* ── Purchase Requests ── */

function rowToRequest(row: Record<string, unknown>): PurchaseRequest {
  return {
    id: row.id as string,
    requesterId: (row.requester_id as string) || '',
    projectId: row.project_id as string | undefined,
    description: (row.description as string) || '',
    quantity: Number(row.quantity) || 1,
    unit: (row.unit as string) || 'pza',
    justification: (row.justification as string) || '',
    urgency: (row.urgency as PurchaseRequest['urgency']) || 'media',
    status: (row.status as PurchaseRequest['status']) || 'pendiente',
    createdAt: (row.created_at as string) || '',
  };
}

function requestToRow(r: Partial<PurchaseRequest>) {
  const row: Record<string, unknown> = {};
  if (r.requesterId !== undefined) row.requester_id = r.requesterId;
  if (r.projectId !== undefined) row.project_id = r.projectId;
  if (r.description !== undefined) row.description = r.description;
  if (r.quantity !== undefined) row.quantity = r.quantity;
  if (r.unit !== undefined) row.unit = r.unit;
  if (r.justification !== undefined) row.justification = r.justification;
  if (r.urgency !== undefined) row.urgency = r.urgency;
  if (r.status !== undefined) row.status = r.status;
  return row;
}

export function usePurchaseRequests() {
  return useQuery({
    queryKey: ['purchase_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToRequest);
    },
  });
}

export function useCreatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Omit<PurchaseRequest, 'id' | 'createdAt'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase.from('purchase_requests')
        .insert({ id, ...requestToRow(r) }).select().single();
      if (error) throw error;
      return rowToRequest(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_requests'] }),
  });
}

export function useUpdatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<PurchaseRequest> & { id: string }) => {
      const { error } = await supabase.from('purchase_requests').update(requestToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_requests'] }),
  });
}

/* ── Purchase Quotes ── */

function rowToQuote(row: Record<string, unknown>): PurchaseQuote {
  return {
    id: row.id as string,
    requestId: (row.request_id as string) || '',
    supplierId: (row.supplier_id as string) || '',
    unitPrice: Number(row.unit_price) || 0,
    total: Number(row.total) || 0,
    deliveryDays: Number(row.delivery_days) || 0,
    conditions: (row.conditions as string) || '',
    selected: Boolean(row.selected),
    selectionNotes: row.selection_notes as string | undefined,
  };
}

function quoteToRow(q: Partial<PurchaseQuote>) {
  const row: Record<string, unknown> = {};
  if (q.requestId !== undefined) row.request_id = q.requestId;
  if (q.supplierId !== undefined) row.supplier_id = q.supplierId;
  if (q.unitPrice !== undefined) row.unit_price = q.unitPrice;
  if (q.total !== undefined) row.total = q.total;
  if (q.deliveryDays !== undefined) row.delivery_days = q.deliveryDays;
  if (q.conditions !== undefined) row.conditions = q.conditions;
  if (q.selected !== undefined) row.selected = q.selected;
  if (q.selectionNotes !== undefined) row.selection_notes = q.selectionNotes;
  return row;
}

export function usePurchaseQuotes(requestId: string | null) {
  return useQuery({
    queryKey: ['purchase_quotes', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_quotes').select('*').eq('request_id', requestId!);
      if (error) throw error;
      return (data || []).map(rowToQuote);
    },
  });
}

export function useCreatePurchaseQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: Omit<PurchaseQuote, 'id'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase.from('purchase_quotes')
        .insert({ id, ...quoteToRow(q) }).select().single();
      if (error) throw error;
      return rowToQuote(data);
    },
    onSuccess: (_, q) => qc.invalidateQueries({ queryKey: ['purchase_quotes', q.requestId] }),
  });
}

export function useSelectQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, requestId, notes }: { quoteId: string; requestId: string; notes?: string }) => {
      // Deselect all quotes for this request, then select the chosen one
      await supabase.from('purchase_quotes').update({ selected: false }).eq('request_id', requestId);
      await supabase.from('purchase_quotes').update({ selected: true, selection_notes: notes || null }).eq('id', quoteId);
      await supabase.from('purchase_requests').update({ status: 'aprobada' }).eq('id', requestId);
    },
    onSuccess: (_, { requestId }) => {
      qc.invalidateQueries({ queryKey: ['purchase_quotes', requestId] });
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
    },
  });
}

/* ── Purchase Orders ── */

function rowToOrder(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: row.id as string,
    requestId: (row.request_id as string) || '',
    supplierId: (row.supplier_id as string) || '',
    quoteId: (row.quote_id as string) || '',
    status: (row.status as PurchaseOrder['status']) || 'borrador',
    total: Number(row.total) || 0,
    issuedAt: row.issued_at as string | undefined,
    receivedAt: row.received_at as string | undefined,
    invoiceXmlUrl: row.invoice_xml_url as string | undefined,
    invoicePdfUrl: row.invoice_pdf_url as string | undefined,
  };
}

function orderToRow(o: Partial<PurchaseOrder>) {
  const row: Record<string, unknown> = {};
  if (o.requestId !== undefined) row.request_id = o.requestId;
  if (o.supplierId !== undefined) row.supplier_id = o.supplierId;
  if (o.quoteId !== undefined) row.quote_id = o.quoteId;
  if (o.status !== undefined) row.status = o.status;
  if (o.total !== undefined) row.total = o.total;
  if (o.issuedAt !== undefined) row.issued_at = o.issuedAt;
  if (o.receivedAt !== undefined) row.received_at = o.receivedAt;
  if (o.invoiceXmlUrl !== undefined) row.invoice_xml_url = o.invoiceXmlUrl;
  if (o.invoicePdfUrl !== undefined) row.invoice_pdf_url = o.invoicePdfUrl;
  return row;
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders').select('*').order('issued_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToOrder);
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: Omit<PurchaseOrder, 'id'>) => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase.from('purchase_orders')
        .insert({ id, ...orderToRow(o) }).select().single();
      if (error) throw error;
      return rowToOrder(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<PurchaseOrder> & { id: string }) => {
      const { error } = await supabase.from('purchase_orders').update(orderToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  });
}
