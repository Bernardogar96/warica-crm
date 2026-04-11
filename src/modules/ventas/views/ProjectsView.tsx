import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { useClients } from '@/modules/crm/hooks/useClients';
import { C, h2Style, inputStyle, btnPrimary, btnSmall, tdStyle } from '@/styles/theme';
import type { Project } from '@/types';

const STATUS_COLOR: Record<Project['status'], string> = {
  activo: '#60a5fa',
  completado: '#4ade80',
  cancelado: '#f87171',
};

const STATUS_LABEL: Record<Project['status'], string> = {
  activo: 'Activo',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

interface Props {
  onSelectProject: (id: string) => void;
}

export function ProjectsView({ onSelectProject }: Props) {
  const { data: projects = [], isLoading } = useProjects();
  const { data: clients = [] } = useClients();
  const updateProject = useUpdateProject();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = projects.filter((p) => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchSearch = !search.trim() || p.projectName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalActive = projects.filter((p) => p.status === 'activo').reduce((s, p) => s + p.amount, 0);
  const totalDone = projects.filter((p) => p.status === 'completado').reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Proyectos activos', value: String(projects.filter((p) => p.status === 'activo').length), color: '#60a5fa' },
          { label: 'Valor en curso', value: fmt(totalActive), color: C.accent },
          { label: 'Total completado', value: fmt(totalDone), color: '#4ade80' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.card, borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Mono', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Proyectos ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, width: 140, fontSize: 12 }}>
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="completado">Completados</option>
            <option value="cancelado">Cancelados</option>
          </select>
          <input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 200, fontSize: 13 }} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>
            {search || statusFilter !== 'all' ? 'Sin resultados' : 'Sin proyectos'}
          </div>
          <div style={{ color: C.textDim, fontSize: 13 }}>
            Los proyectos se crean al cerrar oportunidades como "Cerrado Ganado" en el CRM.
          </div>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Proyecto', 'Cliente', 'Unidad', 'Monto', 'Estatus', 'Inicio', 'Acciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                return (
                  <tr key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: C.text }}>{p.projectName}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{p.serviceType}</div>
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{client?.tradeName || '—'}</td>
                    <td style={{ ...tdStyle, color: C.textDim, fontSize: 12 }}>{p.businessUnit}</td>
                    <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: C.accent }}>{fmt(p.amount)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, borderRadius: 6, padding: '2px 8px',
                        background: STATUS_COLOR[p.status] + '20', color: STATUS_COLOR[p.status],
                      }}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{p.startDate || '—'}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      {p.status === 'activo' && (
                        <button onClick={() => updateProject.mutate({ id: p.id, status: 'completado', completedAt: new Date().toISOString().slice(0, 10) })}
                          style={{ ...btnSmall, color: '#4ade80', fontSize: 11 }}>
                          Completar
                        </button>
                      )}
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
