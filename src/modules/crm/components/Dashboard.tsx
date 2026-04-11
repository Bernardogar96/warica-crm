import { useConfig } from '@/modules/crm/context';
import { C, h2Style, fmt, pct, getStageColor, DEFAULT_STAGES, COMPLETED_STAGE, CANCELLED_STAGE, WON_STAGE } from '@/styles/theme';
import { InlineFilters } from './InlineFilters';
import type { Opportunity } from '@/types';
import type { Filters } from './InlineFilters';

interface DashboardProps {
  opps: Opportunity[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  allOpps: Opportunity[];
}

export function Dashboard({ opps, filters, setFilters, allOpps }: DashboardProps) {
  const { config } = useConfig();
  const stages = config.stages || DEFAULT_STAGES;

  const active = opps.filter((o) => o.stage !== COMPLETED_STAGE && o.stage !== CANCELLED_STAGE && o.stage !== WON_STAGE);
  const won = opps.filter((o) => o.stage === WON_STAGE);
  const completed = opps.filter((o) => o.stage === COMPLETED_STAGE);
  const allClosed = [...won, ...completed];
  const cancelled = opps.filter((o) => o.stage === CANCELLED_STAGE);
  const closedWithDecision = [...allClosed, ...cancelled];
  const hitRate = pct(allClosed.length, closedWithDecision.length);

  const totalActive = active.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const totalWon = [...won, ...completed].reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const wonThisMonth = allClosed.filter((o) =>
    (o.history || []).some((e) =>
      (e.stage === WON_STAGE || e.stage === COMPLETED_STAGE) && e.date?.startsWith(thisMonth),
    ),
  );
  const wonThisMonthAmt = wonThisMonth.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const now = new Date();
  const avgAgeDays = active.length === 0 ? 0 : Math.round(
    active.reduce((sum, o) => {
      const d = o.createdAt ? new Date(o.createdAt) : now;
      return sum + (now.getTime() - d.getTime()) / 86400000;
    }, 0) / active.length,
  );
  const ageLabel = avgAgeDays === 0 ? 'Sin datos' : `${avgAgeDays} día${avgAgeDays !== 1 ? 's' : ''}`;

  const cards = [
    { label: 'Pipeline Activo', value: fmt(totalActive), sub: `${active.length} oportunidades`, color: C.accent },
    { label: '% de Cierre', value: `${hitRate}%`, sub: `${allClosed.length} ganadas / ${closedWithDecision.length} cerradas`, color: hitRate >= 50 ? C.success : hitRate >= 25 ? C.warn : C.danger },
    { label: 'Antigüedad Promedio', value: ageLabel, sub: 'días en pipeline activo', color: avgAgeDays > 60 ? C.danger : avgAgeDays > 30 ? C.warn : C.success },
    { label: 'Ganado este mes', value: fmt(wonThisMonthAmt), sub: `${wonThisMonth.length} oportunidades`, color: C.accent },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8, overflowX: 'auto' }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Dashboard</h2>
        <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: 20, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ color: C.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Mono', color: c.color }}>{c.value}</div>
            <div style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
        <div style={{ color: C.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Desglose por etapa</div>
        {stages.map((s) => {
          const so = opps.filter((o) => o.stage === s);
          const amt = so.reduce((a, o) => a + (Number(o.amount) || 0), 0);
          const maxAmt = Math.max(
            ...stages.map((st) => opps.filter((o) => o.stage === st).reduce((a, o) => a + (Number(o.amount) || 0), 0)),
            1,
          );
          const color = getStageColor(s);
          return (
            <div key={s} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: color, marginRight: 6 }} />
                  {s}
                </span>
                <span style={{ color: C.textDim }}>{so.length} — {fmt(amt)}</span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: color, width: `${pct(amt, maxAmt)}%`, transition: 'width .4s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
