import { useMemo } from 'react';
import { useConfig } from '@/modules/crm/context';
import { C, inputSmall, btnSmall, DEFAULT_STAGES, PRIORITIES, ORG_TYPES, SIZE_RANGES } from '@/styles/theme';
import type { Opportunity } from '@/types';

export interface Filters {
  search: string;
  stage: string;
  salesperson: string;
  priority: string;
  orgType: string;
  sizeRange: string;
}

export const emptyFilters = (): Filters => ({
  search: '', stage: '', salesperson: '', priority: '', orgType: '', sizeRange: '',
});

interface InlineFiltersProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  opps: Opportunity[];
}

export function InlineFilters({ filters, setFilters, opps }: InlineFiltersProps) {
  const { config } = useConfig();
  const salespeople = useMemo(
    () => [...new Set(opps.map((o) => o.salesperson).filter(Boolean))].sort(),
    [opps],
  );
  const allStages = config.stages || DEFAULT_STAGES;
  const hasFilters = Object.values(filters).some(Boolean);
  const set = (k: keyof Filters, v: string) => setFilters({ ...filters, [k]: v });
  const clear = () => setFilters(emptyFilters());

  const micro: React.CSSProperties = {
    ...inputSmall,
    fontSize: 11, padding: '3px 7px', height: 26,
    background: C.surface, border: `1px solid ${C.border}`,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 12 }}>
      <input placeholder="Buscar..." value={filters.search} onChange={(e) => set('search', e.target.value)}
        style={{ ...micro, width: 130 }} />
      <select value={filters.stage} onChange={(e) => set('stage', e.target.value)} style={{ ...micro, cursor: 'pointer' }}>
        <option value="">Etapa</option>
        {allStages.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.priority} onChange={(e) => set('priority', e.target.value)} style={{ ...micro, cursor: 'pointer' }}>
        <option value="">Prioridad</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {salespeople.length > 0 && (
        <select value={filters.salesperson} onChange={(e) => set('salesperson', e.target.value)} style={{ ...micro, cursor: 'pointer' }}>
          <option value="">Vendedor</option>
          {salespeople.map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      <select value={filters.orgType} onChange={(e) => set('orgType', e.target.value)} style={{ ...micro, cursor: 'pointer' }}>
        <option value="">Tipo org.</option>
        {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <select value={filters.sizeRange} onChange={(e) => set('sizeRange', e.target.value)} style={{ ...micro, cursor: 'pointer' }}>
        <option value="">Tamaño</option>
        {SIZE_RANGES.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button onClick={clear}
        style={{ ...btnSmall, color: hasFilters ? C.accent : C.textDim, border: `1px solid ${hasFilters ? C.accent : C.border}`, borderRadius: 5, padding: '2px 8px', fontSize: 10 }}>
        ↺
      </button>
    </div>
  );
}
