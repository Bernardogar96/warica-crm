import { C, h2Style, pct, CANCELLED_STAGE } from '@/styles/theme';
import { InlineFilters } from './InlineFilters';
import type { Opportunity } from '@/types';
import type { Filters } from './InlineFilters';

interface AnalyticsViewProps {
  opps: Opportunity[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  allOpps: Opportunity[];
}

const PIE_COLORS = ['#c15f3c', '#b5882a', '#7a8aa3', '#a88ab5', '#5e7a45', '#8a9e94', '#d1936a', '#b1728a'];

export function AnalyticsView({ opps, filters, setFilters, allOpps }: AnalyticsViewProps) {
  const cancelled = opps.filter((o) => o.stage === CANCELLED_STAGE);
  const reasonCount: Record<string, number> = {};
  cancelled.forEach((o) => { const r = o.lostReason || 'Sin especificar'; reasonCount[r] = (reasonCount[r] || 0) + 1; });
  const sorted = Object.entries(reasonCount).sort((a, b) => b[1] - a[1]);
  const total = cancelled.length;

  let cumAngle = 0;
  const slices = sorted.map(([reason, count], i) => {
    const angle = (count / (total || 1)) * 360;
    const sl = { reason, count, pct: pct(count, total || 1), startAngle: cumAngle, angle, color: PIE_COLORS[i % PIE_COLORS.length] };
    cumAngle += angle;
    return sl;
  });

  const polarToCart = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCart(cx, cy, r, start);
    const e = polarToCart(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8, overflowX: 'auto' }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Análisis</h2>
        <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, padding: 24 }}>
        <div style={{ color: C.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
          Razones de Cancelación
        </div>
        {slices.length === 0 ? (
          <div style={{ color: C.textDim, fontSize: 13, textAlign: 'center', padding: 40 }}>
            No hay oportunidades canceladas aún
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            <svg viewBox="0 0 200 200" width={220} height={220}>
              {slices.map((sl, i) => (
                <path key={i}
                  d={sl.angle >= 360 ? describeArc(100, 100, 90, 0, 359.99) : describeArc(100, 100, 90, sl.startAngle, sl.startAngle + sl.angle)}
                  fill={sl.color} stroke={C.card} strokeWidth={2}>
                  <title>{sl.reason}: {sl.pct}%</title>
                </path>
              ))}
              <circle cx={100} cy={100} r={45} fill={C.card} />
              <text x={100} y={95} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={700} fontFamily="Space Mono">{total}</text>
              <text x={100} y={112} textAnchor="middle" fill={C.textDim} fontSize={10}>canceladas</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slices.map((sl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: sl.color, flexShrink: 0 }} />
                  <span style={{ minWidth: 160 }}>{sl.reason}</span>
                  <span style={{ fontFamily: 'Space Mono', fontWeight: 700, color: sl.color }}>{sl.pct}%</span>
                  <span style={{ color: C.textDim, fontSize: 11 }}>({sl.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
