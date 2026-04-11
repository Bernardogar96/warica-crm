import { useState } from 'react';
import { useConfig } from '@/modules/crm/context';
import {
  C, h2Style, fmt, getStageColor, getOppStatus, DEFAULT_STAGES,
  CANCELLED_STAGE, PRIORITY_COLOR,
} from '@/styles/theme';
import { InlineFilters } from './InlineFilters';
import type { Opportunity } from '@/types';
import type { Filters } from './InlineFilters';

interface KanbanViewProps {
  opps: Opportunity[];
  moveStage: (id: string, stage: string, reason?: string) => void;
  onEdit: (o: Opportunity) => void;
  setModal: (m: { type: string; opp?: Opportunity } | null) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  allOpps: Opportunity[];
}

export function KanbanView({ opps, moveStage, onEdit, setModal, filters, setFilters, allOpps }: KanbanViewProps) {
  const { config } = useConfig();
  const stages = config.stages || DEFAULT_STAGES;
  const extraStages = [...new Set(opps.map((o) => o.stage).filter((s) => s && !stages.includes(s)))];
  const allColumns = [...stages, ...extraStages];
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = (stage: string) => {
    if (!dragging) return;
    if (stage === CANCELLED_STAGE) {
      const opp = opps.find((o) => o.id === dragging);
      setModal({ type: 'cancel', opp });
    } else {
      moveStage(dragging, stage);
    }
    setDragging(null); setDragOver(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8, overflowX: 'auto' }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Kanban</h2>
        <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${allColumns.length},minmax(180px,1fr))`,
        gap: 10, overflowX: 'auto', paddingBottom: 16,
      }}>
        {allColumns.map((s) => {
          const so = opps.filter((o) => o.stage === s);
          const color = getStageColor(s);
          return (
            <div key={s}
              onDragOver={(e) => { e.preventDefault(); setDragOver(s); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(s)}
              style={{
                background: dragOver === s ? `${color}15` : C.surface,
                borderRadius: 12, padding: 10, minHeight: 300,
                border: `1px solid ${dragOver === s ? color : C.border}`,
                transition: 'all .15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '4px 6px' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: color, marginRight: 6 }} />
                  {s}
                </span>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: 'Space Mono' }}>{so.length}</span>
              </div>
              {so.map((o) => {
                const status = getOppStatus(o);
                const pColor = PRIORITY_COLOR[o.priority] || C.textDim;
                return (
                  <div key={o.id} draggable onDragStart={() => setDragging(o.id)} onClick={() => onEdit(o)}
                    style={{
                      background: C.card, borderRadius: 8, padding: 10, marginBottom: 6,
                      cursor: 'grab', fontSize: 12, borderLeft: `2px solid ${color}`,
                      opacity: dragging === o.id ? 0.5 : 1,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <div style={{ fontWeight: 600, flex: 1 }}>{o.projectName || o.company}</div>
                      {o.source === 'google_forms' && (
                        <span style={{ fontSize: 9, background: C.accentDim, color: C.accent, borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap', fontWeight: 600, letterSpacing: '0.02em' }}>FORMS</span>
                      )}
                      {!o.clientId && (
                        <span title="Sin perfil de cliente" style={{ fontSize: 9, background: '#b5882a20', color: C.warn, borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap', fontWeight: 600 }}>⚠ Sin cliente</span>
                      )}
                    </div>
                    {o.projectName && <div style={{ color: C.textDim, fontSize: 11 }}>👤 {o.company}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0' }}>
                      <span style={{ fontSize: 10, color: status.color, background: status.color + '20', borderRadius: 4, padding: '1px 6px' }}>
                        {status.icon} {status.label}
                      </span>
                      {o.priority && (
                        <span style={{ fontSize: 10, color: pColor, background: pColor + '20', borderRadius: 4, padding: '1px 6px' }}>
                          {o.priority}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
                      <span style={{ color, fontFamily: 'Space Mono', fontWeight: 700 }}>{fmt(Number(o.amount) || 0)}</span>
                      {o.salesperson && <span style={{ color: C.textDim, fontSize: 10 }}>👤 {o.salesperson}</span>}
                    </div>
                    {o.stage === CANCELLED_STAGE && o.lostReason && (
                      <div style={{ marginTop: 4, fontSize: 10, color: C.danger, background: C.dangerDim, borderRadius: 4, padding: '2px 6px' }}>
                        {o.lostReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
