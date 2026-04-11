import { useState, useMemo } from 'react';
import { useConfig } from '@/modules/crm/context';
import {
  C, h2Style, fmt, getStageColor, getOppStatus, DEFAULT_STAGES,
  CANCELLED_STAGE, PRIORITY_COLOR, selectSmall, btnSmall, tdStyle, OPP_STATUSES,
} from '@/styles/theme';
import { InlineFilters } from './InlineFilters';
import type { Opportunity } from '@/types';
import type { Filters } from './InlineFilters';

function downloadExcel(rows: Opportunity[]) {
  const headers = ['Proyecto/Empresa', 'Cliente', 'Contacto', 'Vendedor', 'Tipo Org.', 'Prioridad', 'Estado', 'Monto', 'Etapa', 'Fecha', 'Hora Inicio', 'Hora Fin', '# Asistentes', 'Notas'];
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((o) => [
      o.projectName || o.company, o.projectName ? o.company : '', o.contact, o.salesperson,
      o.orgType, o.priority, OPP_STATUSES.find((s) => s.value === o.status)?.label || 'A tiempo',
      o.amount, o.stage, o.createdAt, o.startTime, o.endTime, o.attendees, o.notes,
    ].map(escape).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'oportunidades.csv';
  a.click(); URL.revokeObjectURL(url);
}

interface ListViewProps {
  opps: Opportunity[];
  onEdit: (o: Opportunity) => void;
  onDelete: (id: string) => void;
  moveStage: (id: string, stage: string, reason?: string) => void;
  setModal: (m: { type: string; opp?: Opportunity } | null) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  allOpps: Opportunity[];
}

export function ListView({ opps, onEdit, onDelete, moveStage, setModal, filters, setFilters, allOpps }: ListViewProps) {
  const { config } = useConfig();
  const stages = config.stages || DEFAULT_STAGES;
  const [sort, setSort] = useState<{ col: string | null; dir: 'asc' | 'desc' }>({ col: null, dir: 'desc' });

  const toggleSort = (col: string) =>
    setSort((s) => s.col === col ? { col, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'desc' });

  const displayed = useMemo(() => {
    const rows = [...opps];
    if (sort.col === 'amount') {
      rows.sort((a, b) => sort.dir === 'desc' ? (Number(b.amount) || 0) - (Number(a.amount) || 0) : (Number(a.amount) || 0) - (Number(b.amount) || 0));
    } else if (sort.col === 'date') {
      rows.sort((a, b) => sort.dir === 'desc' ? (b.createdAt || '').localeCompare(a.createdAt || '') : (a.createdAt || '').localeCompare(b.createdAt || ''));
    }
    return rows;
  }, [opps, sort]);

  const SortIcon = ({ col }: { col: string }) => {
    if (sort.col !== col) return <span style={{ color: C.border, marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: C.accent, marginLeft: 4 }}>{sort.dir === 'desc' ? '↓' : '↑'}</span>;
  };

  const thBase: React.CSSProperties = { padding: '10px 12px', color: C.textDim, fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.border}` };
  const thSort: React.CSSProperties = { ...thBase, cursor: 'pointer', userSelect: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <h2 style={{ ...h2Style, margin: 0, whiteSpace: 'nowrap' }}>Listado de Oportunidades</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto', flex: 1 }}>
          <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
        </div>
        <button onClick={() => downloadExcel(displayed)} title="Descargar CSV"
          style={{ ...btnSmall, flexShrink: 0, fontSize: 16, padding: '2px 8px', color: C.accent, border: `1px solid ${C.border}`, borderRadius: 6, lineHeight: 1 }}>
          ⬇
        </button>
      </div>
      <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, textAlign: 'left' }}>
                <th style={thBase}>Proyecto / Empresa</th>
                <th style={thBase}>Cliente</th>
                <th style={thBase}>Contacto</th>
                <th style={thBase}>Vendedor</th>
                <th style={thBase}>Prioridad</th>
                <th style={thBase}>Estado</th>
                <th style={thSort} onClick={() => toggleSort('amount')}>Monto<SortIcon col="amount" /></th>
                <th style={thBase}>Etapa</th>
                <th style={thSort} onClick={() => toggleSort('date')}>Fecha<SortIcon col="date" /></th>
                <th style={thBase}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>No hay oportunidades</td></tr>
              )}
              {displayed.map((o) => {
                const status = getOppStatus(o);
                const stageColor = getStageColor(o.stage);
                const pColor = PRIORITY_COLOR[o.priority] || C.textDim;
                return (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{o.projectName || o.company}</div>
                      {o.projectName && <div style={{ fontSize: 11, color: C.textDim }}>{o.company}</div>}
                    </td>
                    <td style={tdStyle}>
                      {o.clientId ? (
                        <span style={{ fontSize: 11, color: C.success }}>✓ Vinculado</span>
                      ) : (
                        <span style={{ fontSize: 11, background: C.warnDim, color: C.warn, borderRadius: 4, padding: '2px 8px' }}>Sin perfil</span>
                      )}
                    </td>
                    <td style={tdStyle}>{o.contact}</td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{o.salesperson}</td>
                    <td style={tdStyle}>
                      {o.priority && (
                        <span style={{ color: pColor, background: pColor + '20', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{o.priority}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: status.color, fontSize: 12 }}>{status.icon} {status.label}</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontWeight: 700, color: stageColor }}>{fmt(Number(o.amount) || 0)}</td>
                    <td style={tdStyle}>
                      <select value={o.stage} onChange={(e) => {
                        const ns = e.target.value;
                        if (ns === CANCELLED_STAGE) setModal({ type: 'cancel', opp: o });
                        else moveStage(o.id, ns);
                      }} style={{ ...selectSmall, color: stageColor }}>
                        {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{o.createdAt}</td>
                    <td style={tdStyle}>
                      <button onClick={() => onEdit(o)} style={btnSmall}>Editar</button>
                      <button onClick={() => onDelete(o.id)} style={{ ...btnSmall, color: C.danger, marginLeft: 4 }}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
