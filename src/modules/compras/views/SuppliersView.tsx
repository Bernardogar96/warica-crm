import { useState, useMemo } from 'react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSuppliers';
import { SupplierModal } from '../components/SupplierModal';
import { C, h2Style, inputStyle, btnPrimary, btnSmall, tdStyle } from '@/styles/theme';
import type { Supplier } from '@/types';

const thStyle: React.CSSProperties = {
  padding: '10px 14px', color: '#888', fontWeight: 500, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #2a2a2a', textAlign: 'left',
};

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span style={{ color: '#666', fontSize: 12 }}>—</span>;
  return (
    <span style={{ color: '#f59e0b', fontSize: 12 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: '#888', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export function SuppliersView() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Supplier | null | 'new'>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const s = search.toLowerCase();
    return suppliers.filter(
      (sup) => sup.tradeName.toLowerCase().includes(s) ||
        sup.rfc?.toLowerCase().includes(s) ||
        sup.category.toLowerCase().includes(s),
    );
  }, [suppliers, search]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Proveedores ({suppliers.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 200, fontSize: 13 }} />
          <button onClick={() => setModal('new')} style={{ ...btnPrimary, fontSize: 13 }}>
            + Nuevo proveedor
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏭</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>
            {search ? 'Sin resultados' : 'Sin proveedores registrados'}
          </div>
          {!search && (
            <button onClick={() => setModal('new')} style={btnPrimary}>Registrar primer proveedor</button>
          )}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {['Proveedor', 'RFC', 'Categoría', 'Contacto', 'Pago', 'Calificación', 'Acciones'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: C.text }}>{s.tradeName}</div>
                    {s.legalName && s.legalName !== s.tradeName && (
                      <div style={{ fontSize: 11, color: C.textDim }}>{s.legalName}</div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'Space Mono', fontSize: 12, color: C.textDim }}>
                    {s.rfc || '—'}
                  </td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{s.category}</td>
                  <td style={tdStyle}>
                    {s.contact ? (
                      <div>
                        <div style={{ fontSize: 12 }}>{s.contact.name}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>{s.contact.email}</div>
                      </div>
                    ) : <span style={{ color: C.textDim }}>—</span>}
                  </td>
                  <td style={{ ...tdStyle, color: C.textDim, fontSize: 12 }}>{s.paymentTerms || '—'}</td>
                  <td style={tdStyle}><StarRating rating={s.rating} /></td>
                  <td style={tdStyle}>
                    <button onClick={() => setModal(s)} style={btnSmall}>Editar</button>
                    <button onClick={() => {
                      if (confirm(`¿Eliminar a ${s.tradeName}?`)) deleteSupplier.mutate(s.id);
                    }} style={{ ...btnSmall, color: C.danger, marginLeft: 4 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <SupplierModal
          supplier={modal !== 'new' ? modal : undefined}
          onSave={async (data) => {
            if (modal !== 'new' && modal?.id) {
              await updateSupplier.mutateAsync({ id: modal.id, ...data });
            } else {
              await createSupplier.mutateAsync(data);
            }
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
