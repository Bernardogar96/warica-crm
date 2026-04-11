import { useState, useMemo } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { EmployeeModal } from '../components/EmployeeModal';
import { C, h2Style, inputStyle, btnPrimary, btnSmall, tdStyle } from '@/styles/theme';
import type { Employee } from '@/types';

const GROUP_COLOR: Record<string, string> = {
  A: '#4ade80',
  B: '#60a5fa',
  C: '#f59e0b',
};

const STATUS_COLOR: Record<string, string> = {
  activo: '#4ade80',
  baja: '#f87171',
  suspendido: '#f59e0b',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a',
  textAlign: 'left',
};

export function EmployeesView() {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [modal, setModal] = useState<Employee | null | 'new'>(null);

  const filtered = useMemo(() => {
    let list = employees;
    if (groupFilter !== 'all') list = list.filter((e) => e.group === groupFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (e) => e.fullName.toLowerCase().includes(s) ||
          e.rfc.toLowerCase().includes(s) ||
          e.curp.toLowerCase().includes(s) ||
          e.nss.includes(s),
      );
    }
    return list;
  }, [employees, search, groupFilter]);

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Empleados ({employees.length})</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
            style={{ ...inputStyle, width: 130, fontSize: 12 }}>
            <option value="all">Todos los grupos</option>
            <option value="A">Grupo A</option>
            <option value="B">Grupo B</option>
            <option value="C">Grupo C</option>
          </select>
          <input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 200, fontSize: 13 }} />
          <button onClick={() => setModal('new')} style={{ ...btnPrimary, fontSize: 13 }}>
            + Nuevo empleado
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>
            {search || groupFilter !== 'all' ? 'Sin resultados' : 'Sin empleados registrados'}
          </div>
          {!search && groupFilter === 'all' && (
            <button onClick={() => setModal('new')} style={btnPrimary}>Registrar primer empleado</button>
          )}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Empleado', 'Grupo', 'Puesto / Dpto.', 'Sal. Diario', 'SBC', 'Estatus', 'Acciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: C.text }}>{emp.fullName}</div>
                    <div style={{ fontSize: 11, color: C.textDim, fontFamily: 'Space Mono' }}>{emp.rfc}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, borderRadius: 6,
                      padding: '2px 10px', background: (GROUP_COLOR[emp.group] || C.accent) + '20',
                      color: GROUP_COLOR[emp.group] || C.accent,
                    }}>
                      {emp.group}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 12 }}>{emp.position}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{emp.department}</div>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12 }}>
                    {fmt(emp.dailySalary)}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: C.textDim }}>
                    {fmt(emp.sbc)}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, borderRadius: 6, padding: '2px 8px',
                      background: (STATUS_COLOR[emp.status] || C.textDim) + '20',
                      color: STATUS_COLOR[emp.status] || C.textDim,
                    }}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => setModal(emp)} style={btnSmall}>Editar</button>
                    <button onClick={() => {
                      if (confirm(`¿Dar de baja a ${emp.fullName}?`)) {
                        updateEmployee.mutate({ id: emp.id, status: 'baja' });
                      }
                    }} style={{ ...btnSmall, color: C.danger, marginLeft: 4 }}>Baja</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <EmployeeModal
          employee={modal !== 'new' ? modal : undefined}
          onSave={async (data) => {
            if (modal !== 'new' && modal?.id) {
              await updateEmployee.mutateAsync({ id: modal.id, ...data });
            } else {
              await createEmployee.mutateAsync(data);
            }
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
