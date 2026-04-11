import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useInvoices, useCreateInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { useClients } from '@/modules/crm/hooks/useClients';
import { InvoiceModal } from '../components/InvoiceModal';
import { C, h2Style, btnPrimary, btnSecondary, btnSmall, tdStyle } from '@/styles/theme';
import type { Invoice } from '@/types';

const STATUS_COLOR: Record<Invoice['status'], string> = {
  borrador: '#888', emitida: '#60a5fa', cobrada: '#4ade80', cancelada: '#f87171',
};
const STATUS_LABEL: Record<Invoice['status'], string> = {
  borrador: 'Borrador', emitida: 'Emitida', cobrada: 'Cobrada', cancelada: 'Cancelada',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

interface Props {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: Props) {
  const { data: projects = [] } = useProjects();
  const { data: invoices = [] } = useInvoices(projectId);
  const { data: clients = [] } = useClients();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [modal, setModal] = useState<Invoice | null | 'new'>(null);

  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.clientId);

  if (!project) return <div style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando…</div>;

  const totalInvoiced = invoices.filter((i) => i.status !== 'cancelada').reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices.filter((i) => i.status === 'cobrada').reduce((s, i) => s + i.total, 0);
  const pending = totalInvoiced - totalCollected;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}>← Proyectos</button>
        <h2 style={{ ...h2Style, margin: 0, flex: 1 }}>{project.projectName}</h2>
        <span style={{ fontSize: 12, color: C.textDim }}>{client?.tradeName}</span>
        <span style={{ fontSize: 12, color: C.textDim }}>·</span>
        <span style={{ fontSize: 12, color: C.textDim }}>{project.businessUnit}</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Valor del proyecto', value: fmt(project.amount), color: C.accent },
          { label: 'Facturado', value: fmt(totalInvoiced), color: '#60a5fa' },
          { label: 'Cobrado', value: fmt(totalCollected), color: '#4ade80' },
          { label: 'Por cobrar', value: fmt(pending), color: pending > 0 ? '#f59e0b' : C.textDim },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.card, borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Mono', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Client fiscal info */}
      {client && (
        <div style={{ background: C.card, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div><span style={{ color: C.textDim }}>Cliente: </span><span style={{ fontWeight: 600 }}>{client.tradeName}</span></div>
          {client.rfc && <div><span style={{ color: C.textDim }}>RFC: </span><span style={{ fontFamily: 'Space Mono' }}>{client.rfc}</span></div>}
          {client.taxRegime && <div><span style={{ color: C.textDim }}>Régimen: </span><span>{client.taxRegime}</span></div>}
          {client.cfdiUse && <div><span style={{ color: C.textDim }}>Uso CFDI: </span><span>{client.cfdiUse}</span></div>}
        </div>
      )}

      {/* Invoices header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Facturas ({invoices.length})</div>
        <button onClick={() => setModal('new')} style={{ ...btnPrimary, fontSize: 13 }}>+ Nueva factura</button>
      </div>

      {invoices.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 40, textAlign: 'center', border: `1px solid ${C.border}`, color: C.textDim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧾</div>
          <div>Sin facturas para este proyecto.</div>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Folio', 'Emisión', 'Vence', 'Subtotal', 'IVA', 'Total', 'Estatus', ''].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12 }}>{inv.folio || '—'}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{inv.issuedAt || '—'}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{inv.dueDate || '—'}</td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12 }}>{fmt(inv.subtotal)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: C.textDim }}>{fmt(inv.iva)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: C.accent }}>{fmt(inv.total)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, borderRadius: 6, padding: '2px 8px',
                      background: STATUS_COLOR[inv.status] + '20', color: STATUS_COLOR[inv.status],
                    }}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => setModal(inv)} style={{ ...btnSmall, fontSize: 11 }}>Editar</button>
                    {inv.status === 'emitida' && (
                      <button onClick={() => updateInvoice.mutate({ id: inv.id, status: 'cobrada', paidAt: new Date().toISOString().slice(0, 10) })}
                        style={{ ...btnSmall, color: '#4ade80', marginLeft: 4, fontSize: 11 }}>
                        Cobrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <InvoiceModal
          invoice={modal !== 'new' ? modal : undefined}
          project={project}
          onSave={async (data) => {
            if (modal !== 'new' && modal?.id) {
              await updateInvoice.mutateAsync({ id: modal.id, ...data });
            } else {
              await createInvoice.mutateAsync(data);
            }
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
