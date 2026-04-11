import { useState, useMemo } from 'react';
import { useClients, useDeleteClient } from '@/modules/crm/hooks/useClients';
import { ClientModal } from '@/modules/crm/components/ClientModal';
import { useCreateClient, useUpdateClient } from '@/modules/crm/hooks/useClients';
import { C, h2Style, inputStyle, btnPrimary, btnSmall, tdStyle } from '@/styles/theme';
import type { Client } from '@/types';

interface ClientsViewProps {
  onSelectClient: (id: string) => void;
}

export function ClientsView({ onSelectClient }: ClientsViewProps) {
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState('');
  const [modalClient, setModalClient] = useState<Client | null | 'new'>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const s = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.tradeName.toLowerCase().includes(s) ||
        c.legalName?.toLowerCase().includes(s) ||
        c.rfc?.toLowerCase().includes(s),
    );
  }, [clients, search]);

  const hasFiscal = (c: Client) => !!(c.rfc && c.taxRegime && c.cfdiUse && c.fiscalAddress?.zipCode);

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', color: C.textDim, fontWeight: 500, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.border}`,
    textAlign: 'left',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Clientes ({clients.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Buscar por nombre o RFC..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 240, fontSize: 13 }} />
          <button onClick={() => setModalClient('new')} style={{ ...btnPrimary, fontSize: 13 }}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>
            {search ? 'Sin resultados' : 'Sin clientes registrados'}
          </div>
          {!search && (
            <div style={{ color: C.textDim, fontSize: 13, marginBottom: 20 }}>
              Crea el primer perfil de cliente o vincúlalo desde una oportunidad.
            </div>
          )}
          {!search && (
            <button onClick={() => setModalClient('new')} style={btnPrimary}>Crear primer cliente</button>
          )}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>RFC</th>
                <th style={thStyle}>Industria</th>
                <th style={thStyle}>Contacto</th>
                <th style={thStyle}>Datos Fiscales</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const fiscal = hasFiscal(c);
                const primaryContact = c.contacts[0];
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                    onClick={() => onSelectClient(c.id)}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: C.text }}>{c.tradeName}</div>
                      {c.legalName && c.legalName !== c.tradeName && (
                        <div style={{ fontSize: 11, color: C.textDim }}>{c.legalName}</div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim, fontFamily: 'Space Mono', fontSize: 12 }}>
                      {c.rfc || '—'}
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{c.industry || '—'}</td>
                    <td style={tdStyle}>
                      {primaryContact ? (
                        <div>
                          <div style={{ fontSize: 12 }}>{primaryContact.name}</div>
                          <div style={{ fontSize: 11, color: C.textDim }}>{primaryContact.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {fiscal ? (
                        <span style={{ fontSize: 11, background: C.successDim, color: C.success, borderRadius: 6, padding: '2px 8px' }}>✓ Completos</span>
                      ) : (
                        <span style={{ fontSize: 11, background: C.warnDim, color: C.warn, borderRadius: 6, padding: '2px 8px' }}>Incompletos</span>
                      )}
                    </td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setModalClient(c)} style={btnSmall}>Editar</button>
                      <button onClick={() => {
                        if (confirm(`¿Eliminar a ${c.tradeName}?`)) deleteClient.mutate(c.id);
                      }} style={{ ...btnSmall, color: C.danger, marginLeft: 4 }}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalClient && (
        <ClientModal
          client={modalClient !== 'new' ? modalClient : undefined}
          onSave={async (data) => {
            if (modalClient !== 'new' && modalClient?.id) {
              await updateClient.mutateAsync({ id: modalClient.id, ...data });
            } else {
              await createClient.mutateAsync(data);
            }
          }}
          onClose={() => setModalClient(null)}
        />
      )}
    </div>
  );
}
