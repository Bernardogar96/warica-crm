import { useState } from 'react';
import {
  usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest,
  usePurchaseQuotes, useCreatePurchaseQuote, useSelectQuote,
} from '../hooks/usePurchases';
import { useSuppliers } from '../hooks/useSuppliers';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import { C, h2Style, inputStyle, btnPrimary, btnSecondary, btnSmall, today } from '@/styles/theme';
import type { PurchaseRequest, PurchaseQuote } from '@/types';

const URGENCY_COLOR = { alta: '#f87171', media: '#f59e0b', baja: '#4ade80' };
const STATUS_COLOR: Record<PurchaseRequest['status'], string> = {
  pendiente: '#f59e0b', cotizando: '#60a5fa', aprobada: '#4ade80', cancelada: '#888',
};
const STATUS_LABEL: Record<PurchaseRequest['status'], string> = {
  pendiente: 'Pendiente', cotizando: 'Cotizando', aprobada: 'Aprobada', cancelada: 'Cancelada',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};
const tdStyle: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' };
const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

/* ── New Request Form ── */
function NewRequestForm({ userId, onSave, onClose }: { userId: string; onSave: (r: Omit<PurchaseRequest, 'id' | 'createdAt'>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ description: '', quantity: 1, unit: 'pza', justification: '', urgency: 'media' as PurchaseRequest['urgency'] });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.description) return;
    setSaving(true);
    try { await onSave({ ...form, requesterId: userId, status: 'pendiente' }); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 440 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Nueva Solicitud de Compra</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="¿Qué se necesita? *">
            <input value={form.description} onChange={(e) => set('description', e.target.value)}
              style={inputStyle} placeholder="Descripción del bien o servicio" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Cantidad">
              <input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} style={inputStyle} />
            </Field>
            <Field label="Unidad">
              <input value={form.unit} onChange={(e) => set('unit', e.target.value)} style={inputStyle} placeholder="pza, kg, m2…" />
            </Field>
            <Field label="Urgencia">
              <select value={form.urgency} onChange={(e) => set('urgency', e.target.value as PurchaseRequest['urgency'])} style={inputStyle}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </Field>
          </div>
          <Field label="Justificación">
            <textarea value={form.justification} onChange={(e) => set('justification', e.target.value)}
              style={{ ...inputStyle, height: 60, resize: 'vertical' }} placeholder="¿Por qué se necesita?" />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? 'Enviando…' : 'Enviar solicitud'}</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Quotes Panel ── */
function QuotesPanel({ request, onClose }: { request: PurchaseRequest; onClose: () => void }) {
  const { data: quotes = [] } = usePurchaseQuotes(request.id);
  const { data: suppliers = [] } = useSuppliers();
  const createQuote = useCreatePurchaseQuote();
  const selectQuote = useSelectQuote();
  const updateRequest = useUpdatePurchaseRequest();

  const [newQuote, setNewQuote] = useState({ supplierId: '', unitPrice: 0, deliveryDays: 0, conditions: '' });
  const [saving, setSaving] = useState(false);
  const setQ = (k: keyof typeof newQuote, v: string | number) => setNewQuote((q) => ({ ...q, [k]: v }));

  const addQuote = async () => {
    if (!newQuote.supplierId || newQuote.unitPrice <= 0) return;
    setSaving(true);
    try {
      const total = Math.round(newQuote.unitPrice * request.quantity * 100) / 100;
      await createQuote.mutateAsync({ ...newQuote, requestId: request.id, total, selected: false });
      setNewQuote({ supplierId: '', unitPrice: 0, deliveryDays: 0, conditions: '' });
      // Move to cotizando
      if (request.status === 'pendiente') {
        await updateRequest.mutateAsync({ id: request.id, status: 'cotizando' });
      }
    } finally {
      setSaving(false); }
  };

  const minQuotesRequired = 2;
  const canApprove = quotes.length >= minQuotesRequired;

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 580 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>Cotizaciones</h3>
        <div style={{ fontSize: 13, color: C.textDim, marginBottom: 16 }}>
          {request.description} — {request.quantity} {request.unit}
        </div>

        {!canApprove && (
          <div style={{ background: C.warnDim, border: `1px solid ${C.warn}40`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.warn, marginBottom: 12 }}>
            ⚠ Se requieren mínimo {minQuotesRequired} cotizaciones antes de aprobar.
          </div>
        )}

        {/* Existing quotes */}
        {quotes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {quotes.map((q) => {
              const sup = suppliers.find((s) => s.id === q.supplierId);
              return (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: q.selected ? '#4ade8015' : C.card, border: `1px solid ${q.selected ? '#4ade80' : C.border}`,
                  borderRadius: 8, marginBottom: 6,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{sup?.tradeName || 'Proveedor'}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{q.deliveryDays} días · {q.conditions}</div>
                  </div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 13, color: C.accent }}>{fmt(q.total)}</div>
                  {!q.selected && request.status !== 'aprobada' && canApprove && (
                    <button onClick={() => selectQuote.mutate({ quoteId: q.id, requestId: request.id })}
                      style={{ ...btnSmall, color: '#4ade80', fontSize: 11 }}>
                      Elegir
                    </button>
                  )}
                  {q.selected && <span style={{ fontSize: 11, color: '#4ade80' }}>✓ Elegida</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Add quote form */}
        {request.status !== 'aprobada' && (
          <div style={{ background: C.card, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Agregar cotización
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
              <Field label="Proveedor">
                <select value={newQuote.supplierId} onChange={(e) => setQ('supplierId', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.tradeName}</option>)}
                </select>
              </Field>
              <Field label="Precio unit.">
                <input type="number" min="0" step="0.01" value={newQuote.unitPrice || ''}
                  onChange={(e) => setQ('unitPrice', Number(e.target.value))} style={inputStyle} />
              </Field>
              <Field label="Días entrega">
                <input type="number" min="0" value={newQuote.deliveryDays || ''}
                  onChange={(e) => setQ('deliveryDays', Number(e.target.value))} style={inputStyle} />
              </Field>
            </div>
            <Field label="Condiciones">
              <input value={newQuote.conditions} onChange={(e) => setQ('conditions', e.target.value)}
                style={inputStyle} placeholder="Garantía, forma de pago, etc." />
            </Field>
            <button onClick={addQuote} disabled={saving} style={{ ...btnPrimary, marginTop: 10, fontSize: 12 }}>
              {saving ? 'Guardando…' : '+ Agregar cotización'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Cerrar</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Main View ── */
interface Props { userId: string; }

export function PurchaseRequestsView({ userId }: Props) {
  const { data: requests = [], isLoading } = usePurchaseRequests();
  const createRequest = useCreatePurchaseRequest();
  const [showNew, setShowNew] = useState(false);
  const [viewQuotes, setViewQuotes] = useState<PurchaseRequest | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Solicitudes de Compra</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{ ...inputStyle, width: 140, fontSize: 12 }}>
            <option value="all">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="cotizando">Cotizando</option>
            <option value="aprobada">Aprobadas</option>
          </select>
          <button onClick={() => setShowNew(true)} style={{ ...btnPrimary, fontSize: 13 }}>+ Nueva solicitud</button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Sin solicitudes</div>
          <button onClick={() => setShowNew(true)} style={btnPrimary}>Crear solicitud</button>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Descripción', 'Cantidad', 'Urgencia', 'Estatus', 'Fecha', 'Cotizaciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{r.description}</div>
                    {r.justification && <div style={{ fontSize: 11, color: C.textDim }}>{r.justification}</div>}
                  </td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{r.quantity} {r.unit}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, borderRadius: 6, padding: '2px 8px', background: URGENCY_COLOR[r.urgency] + '20', color: URGENCY_COLOR[r.urgency] }}>
                      {r.urgency}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, borderRadius: 6, padding: '2px 8px', background: STATUS_COLOR[r.status] + '20', color: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{r.createdAt.slice(0, 10)}</td>
                  <td style={tdStyle}>
                    {r.status !== 'cancelada' && (
                      <button onClick={() => setViewQuotes(r)} style={{ ...btnSmall, fontSize: 11 }}>
                        Ver cotizaciones
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewRequestForm
          userId={userId}
          onSave={(data) => createRequest.mutateAsync(data)}
          onClose={() => setShowNew(false)}
        />
      )}
      {viewQuotes && (
        <QuotesPanel request={viewQuotes} onClose={() => setViewQuotes(null)} />
      )}
    </div>
  );
}
