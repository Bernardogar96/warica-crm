import { useState, useMemo } from 'react';
import { Overlay } from '@/components/Overlay';
import { useClients } from '@/modules/crm/hooks/useClients';
import { C, inputStyle, btnPrimary, btnSecondary } from '@/styles/theme';
import type { Client } from '@/types';

interface LinkClientModalProps {
  onSelect: (client: Client) => void;
  onClose: () => void;
}

export function LinkClientModal({ onSelect, onClose }: LinkClientModalProps) {
  const { data: clients = [], isLoading } = useClients();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const s = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.tradeName.toLowerCase().includes(s) ||
        c.legalName?.toLowerCase().includes(s) ||
        c.rfc?.toLowerCase().includes(s) ||
        c.emails.some((e) => e.toLowerCase().includes(s)),
    );
  }, [clients, search]);

  const hasFiscal = (c: Client) => !!(c.rfc && c.taxRegime && c.cfdiUse && c.fiscalAddress?.zipCode);

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 500 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Vincular cliente existente</h3>
        <input
          autoFocus
          placeholder="Buscar por nombre, RFC o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 24, color: C.textDim }}>Cargando...</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: C.textDim, fontSize: 13 }}>
              {search ? 'Sin resultados' : 'No hay clientes registrados'}
            </div>
          )}
          {filtered.map((c) => {
            const fiscal = hasFiscal(c);
            return (
              <div key={c.id}
                onClick={() => onSelect(c)}
                style={{
                  background: C.surface, borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                  border: `1px solid ${C.border}`, transition: 'border-color .15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{c.tradeName}</div>
                  {c.legalName && c.legalName !== c.tradeName && (
                    <div style={{ fontSize: 11, color: C.textDim }}>{c.legalName}</div>
                  )}
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {c.rfc || 'Sin RFC'} · {c.emails[0] || 'Sin correo'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {fiscal ? (
                    <span style={{ fontSize: 10, background: C.successDim, color: C.success, borderRadius: 4, padding: '2px 8px' }}>✓ Datos fiscales</span>
                  ) : (
                    <span style={{ fontSize: 10, background: C.warnDim, color: C.warn, borderRadius: 4, padding: '2px 8px' }}>Sin datos fiscales</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
        </div>
      </div>
    </Overlay>
  );
}
