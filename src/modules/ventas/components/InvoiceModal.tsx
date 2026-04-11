import { useState } from 'react';
import { useClients } from '@/modules/crm/hooks/useClients';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import {
  C, inputStyle, btnPrimary, btnSecondary, btnSmall, today,
} from '@/styles/theme';
import type { Invoice, InvoiceConcept, Project } from '@/types';

interface Props {
  invoice?: Invoice;
  project: Project;
  onSave: (data: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

const PAYMENT_TERMS = ['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 45 días', 'Crédito 60 días'];
const STATUS_OPTIONS: Invoice['status'][] = ['borrador', 'emitida', 'cobrada', 'cancelada'];
const STATUS_LABEL: Record<Invoice['status'], string> = {
  borrador: 'Borrador', emitida: 'Emitida', cobrada: 'Cobrada', cancelada: 'Cancelada',
};

const IVA_RATE = 0.16;

function emptyConcept(): InvoiceConcept {
  return { description: '', quantity: 1, unitPrice: 0, amount: 0 };
}

function calcTotals(concepts: InvoiceConcept[], ivaExempt: boolean) {
  const subtotal = concepts.reduce((s, c) => s + c.amount, 0);
  const iva = ivaExempt ? 0 : Math.round(subtotal * IVA_RATE * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, iva, total: Math.round((subtotal + iva) * 100) / 100 };
}

export function InvoiceModal({ invoice, project, onSave, onClose }: Props) {
  const { data: clients = [] } = useClients();
  const client = clients.find((c) => c.id === project.clientId);

  const [concepts, setConcepts] = useState<InvoiceConcept[]>(
    invoice?.concepts?.length ? invoice.concepts : [{ ...emptyConcept(), description: project.projectName, unitPrice: project.amount, quantity: 1, amount: project.amount }],
  );
  const [status, setStatus] = useState<Invoice['status']>(invoice?.status || 'borrador');
  const [folio, setFolio] = useState(invoice?.folio || '');
  const [issuedAt, setIssuedAt] = useState(invoice?.issuedAt || today());
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
  const [paidAt, setPaidAt] = useState(invoice?.paidAt || '');
  const [paymentNotes, setPaymentNotes] = useState(invoice?.paymentNotes || '');
  const [ivaExempt, setIvaExempt] = useState(invoice ? invoice.iva === 0 : false);
  const [saving, setSaving] = useState(false);

  const updateConcept = (i: number, field: keyof InvoiceConcept, value: string | number) => {
    setConcepts((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        next[i].amount = Math.round(Number(next[i].quantity) * Number(next[i].unitPrice) * 100) / 100;
      }
      return next;
    });
  };

  const { subtotal, iva, total } = calcTotals(concepts, ivaExempt);
  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const handleSave = async () => {
    if (concepts.length === 0) return;
    setSaving(true);
    try {
      await onSave({
        projectId: project.id,
        clientId: project.clientId,
        folio: folio || undefined,
        concepts,
        subtotal,
        iva,
        total,
        status,
        issuedAt: issuedAt || undefined,
        dueDate: dueDate || undefined,
        paidAt: status === 'cobrada' ? (paidAt || today()) : undefined,
        paymentNotes: paymentNotes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 620 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>
          {invoice ? 'Editar Factura' : 'Nueva Factura'}
        </h3>

        {/* Client info */}
        {client && (
          <div style={{ background: C.card, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: C.text }}>{client.tradeName}</div>
            {client.legalName && <div style={{ color: C.textDim }}>{client.legalName}</div>}
            <div style={{ color: C.textDim, fontFamily: 'Space Mono' }}>RFC: {client.rfc || 'Sin RFC'}</div>
            {client.taxRegime && <div style={{ color: C.textDim }}>Régimen: {client.taxRegime}</div>}
            {client.cfdiUse && <div style={{ color: C.textDim }}>Uso CFDI: {client.cfdiUse}</div>}
          </div>
        )}

        {/* Header fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Field label="Folio">
            <input value={folio} onChange={(e) => setFolio(e.target.value)}
              style={inputStyle} placeholder="001" />
          </Field>
          <Field label="Estatus">
            <select value={status} onChange={(e) => setStatus(e.target.value as Invoice['status'])} style={inputStyle}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Fecha emisión">
            <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Fecha vencimiento">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
          </Field>
          {status === 'cobrada' && (
            <Field label="Fecha de cobro">
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} style={inputStyle} />
            </Field>
          )}
        </div>

        {/* Concepts */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Conceptos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {concepts.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 120px 120px 32px', gap: 6, alignItems: 'center' }}>
                <input value={c.description} onChange={(e) => updateConcept(i, 'description', e.target.value)}
                  style={{ ...inputStyle, fontSize: 12 }} placeholder="Descripción del servicio" />
                <input type="number" min="0" step="0.01" value={c.quantity}
                  onChange={(e) => updateConcept(i, 'quantity', Number(e.target.value))}
                  style={{ ...inputStyle, fontSize: 12, textAlign: 'center' }} placeholder="Cant." />
                <input type="number" min="0" step="0.01" value={c.unitPrice}
                  onChange={(e) => updateConcept(i, 'unitPrice', Number(e.target.value))}
                  style={{ ...inputStyle, fontSize: 12 }} placeholder="Precio unit." />
                <div style={{ ...inputStyle, background: C.surface, color: C.textDim, fontSize: 12, fontFamily: 'Space Mono', cursor: 'default' }}>
                  {fmt(c.amount)}
                </div>
                <button onClick={() => setConcepts((prev) => prev.filter((_, j) => j !== i))}
                  style={{ ...btnSmall, color: C.danger, padding: '4px 8px' }}>×</button>
              </div>
            ))}
          </div>
          <button onClick={() => setConcepts((prev) => [...prev, emptyConcept()])}
            style={{ ...btnSmall, marginTop: 8, fontSize: 12 }}>
            + Agregar concepto
          </button>
        </div>

        {/* IVA toggle + totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 12, color: C.textDim }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={ivaExempt} onChange={(e) => setIvaExempt(e.target.checked)} />
              Exento de IVA
            </label>
            <Field label="Notas de cobro" style={{ marginTop: 8 }}>
              <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
                style={{ ...inputStyle, height: 48, resize: 'vertical', width: '100%', minWidth: 220 }} />
            </Field>
          </div>
          <div style={{ background: C.card, borderRadius: 8, padding: '12px 16px', minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: C.textDim }}>Subtotal</span>
              <span style={{ fontFamily: 'Space Mono' }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: C.textDim }}>IVA 16%</span>
              <span style={{ fontFamily: 'Space Mono', color: ivaExempt ? C.textDim : C.text }}>{fmt(iva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: `1px solid ${C.border}`, paddingTop: 8, fontWeight: 700, fontSize: 15 }}>
              <span>Total</span>
              <span style={{ fontFamily: 'Space Mono', color: C.accent }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {!client?.rfc && (
          <div style={{ background: C.warnDim, border: `1px solid ${C.warn}40`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.warn, marginTop: 12 }}>
            ⚠ El cliente no tiene RFC registrado. Completa el perfil fiscal antes de emitir la factura CFDI.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Guardando…' : invoice ? 'Guardar' : 'Crear factura'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
