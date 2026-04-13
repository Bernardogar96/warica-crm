import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '@/modules/crm/hooks/useClients';
import { C, h2Style, tdStyle } from '@/styles/theme';
import type { Invoice, Project } from '@/types';

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};

type BillingStatus = 'pendiente' | 'facturado' | 'parcial' | 'cobrado';

const STATUS_LABEL: Record<BillingStatus, string> = {
  pendiente: 'Pendiente por facturar',
  facturado: 'Facturado',
  parcial: 'Parcialmente cobrado',
  cobrado: 'Cobrado',
};

const STATUS_COLOR: Record<BillingStatus, string> = {
  pendiente: '#f59e0b',
  facturado: '#60a5fa',
  parcial: '#f97316',
  cobrado: '#4ade80',
};

function getBillingStatus(invoices: Invoice[]): BillingStatus {
  const active = invoices.filter((i) => i.status !== 'cancelada' && i.status !== 'borrador');
  if (active.length === 0) return 'pendiente';
  const cobradas = active.filter((i) => i.status === 'cobrada');
  if (cobradas.length === active.length) return 'cobrado';
  if (cobradas.length > 0) return 'parcial';
  return 'facturado';
}

interface Props {
  onSelectProject: (id: string) => void;
}

export function FacturacionView({ onSelectProject }: Props) {
  const { data: projects = [], isLoading } = useProjects();
  const { data: allInvoices = [] } = useInvoices();
  const { data: clients = [] } = useClients();

  // Group invoices by project
  const invoicesByProject = allInvoices.reduce<Record<string, Invoice[]>>((acc, inv) => {
    if (!acc[inv.projectId]) acc[inv.projectId] = [];
    acc[inv.projectId].push(inv);
    return acc;
  }, {});

  // KPIs
  const totalValor = projects.reduce((s, p) => s + p.amount, 0);
  const totalFacturado = allInvoices
    .filter((i) => i.status !== 'cancelada')
    .reduce((s, i) => s + i.total, 0);
  const totalCobrado = allInvoices
    .filter((i) => i.status === 'cobrada')
    .reduce((s, i) => s + i.total, 0);
  const pendientes = projects.filter((p) => getBillingStatus(invoicesByProject[p.id] || []) === 'pendiente').length;

  const kpis = [
    { label: 'Proyectos activos', value: String(projects.filter((p) => p.status === 'activo').length), color: '#60a5fa' },
    { label: 'Pendientes por facturar', value: String(pendientes), color: '#f59e0b' },
    { label: 'Total facturado', value: fmt(totalFacturado), color: C.accent },
    { label: 'Total cobrado', value: fmt(totalCobrado), color: '#4ade80' },
    { label: 'Por cobrar', value: fmt(totalFacturado - totalCobrado), color: '#f97316' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ background: C.card, borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Mono', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ ...h2Style, marginBottom: 16 }}>Facturación — Todos los proyectos ({projects.length})</h2>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando…</div>
      ) : projects.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Sin proyectos</div>
          <div style={{ color: C.textDim, fontSize: 13 }}>Los proyectos se generan al cerrar oportunidades como "Cerrado Ganado" en el CRM.</div>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Proyecto', 'Cliente', 'Unidad', 'Fecha', 'Valor', 'Facturado', 'Cobrado', 'Estatus'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p: Project) => {
                const client = clients.find((c) => c.id === p.clientId);
                const invoices = invoicesByProject[p.id] || [];
                const status = getBillingStatus(invoices);
                const facturado = invoices.filter((i) => i.status !== 'cancelada').reduce((s, i) => s + i.total, 0);
                const cobrado = invoices.filter((i) => i.status === 'cobrada').reduce((s, i) => s + i.total, 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: C.text }}>{p.projectName}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{p.serviceType}</div>
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{client?.tradeName || '—'}</td>
                    <td style={{ ...tdStyle, color: C.textDim, fontSize: 12 }}>{p.businessUnit}</td>
                    <td style={{ ...tdStyle, color: C.textDim, fontSize: 12 }}>{p.startDate || p.createdAt.slice(0, 10)}</td>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: C.accent }}>{fmt(p.amount)}</td>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: facturado > 0 ? '#60a5fa' : C.textDim }}>
                      {facturado > 0 ? fmt(facturado) : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: cobrado > 0 ? '#4ade80' : C.textDim }}>
                      {cobrado > 0 ? fmt(cobrado) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap',
                        background: STATUS_COLOR[status] + '20', color: STATUS_COLOR[status],
                      }}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
