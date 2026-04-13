import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useInvoices } from '../hooks/useInvoices';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '@/modules/crm/hooks/useClients';
import { C, tdStyle } from '@/styles/theme';

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const BUCKETS = [
  { key: '0–30 días',  min: 0,  max: 30,  color: '#4ade80' },
  { key: '31–60 días', min: 31, max: 60,  color: '#f59e0b' },
  { key: '61–90 días', min: 61, max: 90,  color: '#f97316' },
  { key: '90+ días',   min: 91, max: Infinity, color: '#f87171' },
];

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const today = new Date();
  return Math.max(0, Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function getBucket(days: number) {
  return BUCKETS.find((b) => days >= b.min && days <= b.max) ?? BUCKETS[BUCKETS.length - 1];
}

export function CobranzaView() {
  const { data: invoices = [] } = useInvoices();
  const { data: projects = [] } = useProjects();
  const { data: clients = [] } = useClients();

  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const clientMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  // Only emitidas (outstanding, not yet collected)
  const pending = useMemo(() =>
    invoices.filter((i) => i.status === 'emitida').map((i) => {
      const ref = i.dueDate || i.issuedAt || i.createdAt;
      const days = daysSince(ref);
      const bucket = getBucket(days);
      const project = projectMap[i.projectId];
      const client = project ? clientMap[project.clientId] : undefined;
      return { ...i, days, bucket, project, client };
    }),
    [invoices, projectMap, clientMap],
  );

  // Bucket totals for chart
  const chartData = BUCKETS.map((b) => ({
    name: b.key,
    monto: pending.filter((i) => i.bucket.key === b.key).reduce((s, i) => s + i.total, 0),
    color: b.color,
  }));

  const totalCartera = pending.reduce((s, i) => s + i.total, 0);

  // Group by client
  const byClient = useMemo(() => {
    const map: Record<string, { name: string; total: number; buckets: Record<string, number> }> = {};
    for (const inv of pending) {
      const clientId = inv.project?.clientId ?? inv.clientId;
      const name = inv.client?.tradeName ?? 'Sin cliente';
      if (!map[clientId]) map[clientId] = { name, total: 0, buckets: {} };
      map[clientId].total += inv.total;
      map[clientId].buckets[inv.bucket.key] = (map[clientId].buckets[inv.bucket.key] ?? 0) + inv.total;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [pending]);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Cobranza</div>
        <div style={{ fontSize: 13, color: C.textDim }}>
          Cartera vigente por cobrar:{' '}
          <span style={{ color: '#f97316', fontFamily: 'Space Mono', fontWeight: 700 }}>{fmt(totalCartera)}</span>
          {' '}· {pending.length} facturas pendientes
        </div>
      </div>

      {pending.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Sin cartera pendiente</div>
          <div style={{ color: C.textDim, fontSize: 13, marginTop: 8 }}>Todas las facturas han sido cobradas.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Chart */}
          <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Antigüedad de cartera</div>

            {/* Bucket summary pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {BUCKETS.map((b) => {
                const amount = chartData.find((d) => d.name === b.key)?.monto ?? 0;
                const count = pending.filter((i) => i.bucket.key === b.key).length;
                return (
                  <div key={b.key} style={{ background: b.color + '15', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${b.color}` }}>
                    <div style={{ fontSize: 10, color: b.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.key}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Mono', color: b.color, marginTop: 2 }}>{fmt(amount)}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{count} factura{count !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  formatter={(value: number) => [fmt(value), 'Monto']}
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: C.text }}
                />
                <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Client list */}
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Clientes con saldo pendiente</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.surface }}>
                  {['Cliente', '0–30', '31–60', '61–90', '90+', 'Total'].map((h) => (
                    <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byClient.map((cl) => (
                  <tr key={cl.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: C.text, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cl.name}
                    </td>
                    {BUCKETS.map((b) => {
                      const amount = cl.buckets[b.key] ?? 0;
                      return (
                        <td key={b.key} style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 11, color: amount > 0 ? b.color : C.textDim }}>
                          {amount > 0 ? fmt(amount) : '—'}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: '#f97316' }}>
                      {fmt(cl.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
