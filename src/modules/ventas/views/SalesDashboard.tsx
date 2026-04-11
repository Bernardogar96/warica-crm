import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProjects } from '../hooks/useProjects';
import { useInvoices } from '../hooks/useInvoices';
import { C, h2Style } from '@/styles/theme';

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
const fmtShort = (n: number) => n >= 1000000
  ? `$${(n / 1000000).toFixed(1)}M`
  : n >= 1000
  ? `$${(n / 1000).toFixed(0)}K`
  : `$${n}`;

export function SalesDashboard() {
  const { data: projects = [] } = useProjects();
  const { data: invoices = [] } = useInvoices();

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'activo');
    const completed = projects.filter((p) => p.status === 'completado');
    const totalPipeline = active.reduce((s, p) => s + p.amount, 0);
    const totalRevenue = completed.reduce((s, p) => s + p.amount, 0);
    const totalInvoiced = invoices.filter((i) => i.status !== 'cancelada').reduce((s, i) => s + i.total, 0);
    const totalCollected = invoices.filter((i) => i.status === 'cobrada').reduce((s, i) => s + i.total, 0);
    const pendingCollection = totalInvoiced - totalCollected;

    // Revenue by business unit
    const byUnit: Record<string, number> = {};
    completed.forEach((p) => {
      byUnit[p.businessUnit] = (byUnit[p.businessUnit] || 0) + p.amount;
    });
    const unitData = Object.entries(byUnit).map(([name, value]) => ({ name, value }));

    // Monthly revenue (last 6 months)
    const monthly: Record<string, number> = {};
    completed.forEach((p) => {
      const month = (p.completedAt || p.createdAt || '').slice(0, 7);
      if (month) monthly[month] = (monthly[month] || 0) + p.amount;
    });
    const monthlyData = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, value]) => ({
        name: month.replace('-', '/'),
        value,
      }));

    return { active: active.length, completed: completed.length, totalPipeline, totalRevenue, totalInvoiced, totalCollected, pendingCollection, unitData, monthlyData };
  }, [projects, invoices]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ ...h2Style, marginBottom: 24 }}>Dashboard de Ventas</h2>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Proyectos activos', value: String(stats.active), color: '#60a5fa' },
          { label: 'Pipeline activo', value: fmt(stats.totalPipeline), color: C.accent },
          { label: 'Revenue total', value: fmt(stats.totalRevenue), color: '#4ade80' },
          { label: 'Facturado', value: fmt(stats.totalInvoiced), color: '#a78bfa' },
          { label: 'Cobrado', value: fmt(stats.totalCollected), color: '#4ade80' },
          { label: 'Por cobrar', value: fmt(stats.pendingCollection), color: stats.pendingCollection > 0 ? '#f59e0b' : C.textDim },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.card, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Mono', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Monthly revenue */}
        <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Revenue mensual</div>
          {stats.monthlyData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textDim, fontSize: 13 }}>Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'Revenue']}
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: C.textDim }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.monthlyData.map((_, i) => (
                    <Cell key={i} fill={C.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By business unit */}
        <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Revenue por unidad</div>
          {stats.unitData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textDim, fontSize: 13 }}>Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.unitData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'Revenue']}
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: C.textDim }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.unitData.map((_, i) => (
                    <Cell key={i} fill={['#c15f3c', '#60a5fa', '#4ade80', '#f59e0b'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
