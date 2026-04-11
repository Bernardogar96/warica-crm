import { useState } from 'react';
import { useClient, useUpdateClient } from '@/modules/crm/hooks/useClients';
import { ClientModal } from '@/modules/crm/components/ClientModal';
import {
  C, h2Style, fmt, btnPrimary, btnSecondary, btnSmall, getStageColor,
  COMPLETED_STAGE, CANCELLED_STAGE, WON_STAGE,
} from '@/styles/theme';
import type { Opportunity } from '@/types';

interface ClientDetailProps {
  clientId: string;
  allOpps: Opportunity[];
  onBack: () => void;
}

export function ClientDetail({ clientId, allOpps, onBack }: ClientDetailProps) {
  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const [tab, setTab] = useState<'info' | 'historial'>('info');
  const [editing, setEditing] = useState(false);

  const clientOpps = allOpps.filter((o) => o.clientId === clientId);
  const wonOpps = clientOpps.filter((o) => o.stage === WON_STAGE || o.stage === COMPLETED_STAGE);
  const activeOpps = clientOpps.filter((o) => o.stage !== COMPLETED_STAGE && o.stage !== CANCELLED_STAGE && o.stage !== WON_STAGE);
  const totalBilled = wonOpps.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const avgTicket = wonOpps.length > 0 ? totalBilled / wonOpps.length : 0;

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando...</div>;
  if (!client) return <div style={{ padding: 40, textAlign: 'center', color: C.danger }}>Cliente no encontrado</div>;

  const hasFiscal = !!(client.rfc && client.taxRegime && client.cfdiUse && client.fiscalAddress?.zipCode);

  const tabBtn = (id: typeof tab, label: string) => (
    <button onClick={() => setTab(id)}
      style={{
        background: tab === id ? C.accentDim : 'transparent', color: tab === id ? C.accent : C.textDim,
        border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
      }}>{label}</button>
  );

  const sectionLabel = (t: string) => (
    <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>{t}</div>
  );

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    value ? (
      <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 12, color: C.textDim, minWidth: 160 }}>{label}</span>
        <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{value}</span>
      </div>
    ) : null
  );

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }}>← Clientes</button>
        <h2 style={{ ...h2Style, margin: 0, flex: 1 }}>{client.tradeName}</h2>
        {hasFiscal ? (
          <span style={{ fontSize: 11, background: C.successDim, color: C.success, borderRadius: 6, padding: '3px 10px' }}>✓ Datos fiscales completos</span>
        ) : (
          <span style={{ fontSize: 11, background: C.warnDim, color: C.warn, borderRadius: 6, padding: '3px 10px' }}>⚠ Datos fiscales incompletos</span>
        )}
        <button onClick={() => setEditing(true)} style={{ ...btnPrimary, fontSize: 12, padding: '6px 14px' }}>Editar</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Oportunidades activas', value: String(activeOpps.length), color: C.accent },
          { label: 'Proyectos ganados', value: String(wonOpps.length), color: C.success },
          { label: 'Total facturado', value: fmt(totalBilled), color: C.success },
          { label: 'Ticket promedio', value: avgTicket > 0 ? fmt(avgTicket) : '—', color: C.textDim },
        ].map((kpi, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 10, padding: 16, borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Mono', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        {tabBtn('info', 'Información')}
        {tabBtn('historial', `Historial (${clientOpps.length})`)}
      </div>

      {/* ── Info tab ── */}
      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* General */}
          <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
            {sectionLabel('Información general')}
            <InfoRow label="Nombre comercial" value={client.tradeName} />
            <InfoRow label="Razón social" value={client.legalName} />
            <InfoRow label="Industria" value={client.industry} />
            <InfoRow label="Tamaño" value={client.companySize} />
            <InfoRow label="Sitio web" value={client.website} />
            <InfoRow label="Dirección operativa" value={client.operationalAddress} />

            {client.phones.length > 0 && (
              <>
                {sectionLabel('Teléfonos')}
                {client.phones.map((p, i) => <InfoRow key={i} label={`Tel ${i + 1}`} value={p} />)}
              </>
            )}
            {client.emails.length > 0 && (
              <>
                {sectionLabel('Correos')}
                {client.emails.map((e, i) => <InfoRow key={i} label={`Email ${i + 1}`} value={e} />)}
              </>
            )}
          </div>

          {/* Fiscal */}
          <div>
            <div style={{ background: C.card, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              {sectionLabel('Datos fiscales')}
              {!hasFiscal && (
                <div style={{ background: C.warnDim, border: `1px solid ${C.warn}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: C.warn }}>
                  ⚠ Completa los datos fiscales para poder emitir facturas.
                  <button onClick={() => setEditing(true)} style={{ ...btnSmall, color: C.warn, textDecoration: 'underline', marginLeft: 4 }}>Completar ahora</button>
                </div>
              )}
              <InfoRow label="RFC" value={client.rfc} />
              <InfoRow label="Régimen fiscal" value={client.taxRegime} />
              <InfoRow label="Uso CFDI" value={client.cfdiUse} />
              <InfoRow label="Correo facturas" value={client.invoiceEmail} />
              <InfoRow label="Condiciones de pago" value={client.paymentTerms} />
              {client.fiscalAddress?.street && (
                <>
                  {sectionLabel('Dirección fiscal')}
                  <InfoRow label="Calle" value={`${client.fiscalAddress.street} ${client.fiscalAddress.number}`} />
                  <InfoRow label="Colonia" value={client.fiscalAddress.colony} />
                  <InfoRow label="Municipio / CP" value={`${client.fiscalAddress.municipality}, ${client.fiscalAddress.state} ${client.fiscalAddress.zipCode}`} />
                </>
              )}
            </div>

            {/* Contactos */}
            {client.contacts.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
                {sectionLabel('Contactos clave')}
                {client.contacts.map((contact, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i < client.contacts.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{contact.name}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{contact.position}</div>
                    {contact.email && <div style={{ fontSize: 12, color: C.accent }}>{contact.email}</div>}
                    {contact.phone && <div style={{ fontSize: 12, color: C.textDim }}>{contact.phone}</div>}
                    {contact.relationship && (
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{contact.relationship}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Historial tab ── */}
      {tab === 'historial' && (
        <div>
          {clientOpps.length === 0 ? (
            <div style={{ background: C.card, borderRadius: 12, padding: 40, textAlign: 'center', color: C.textDim, border: `1px solid ${C.border}` }}>
              Sin oportunidades vinculadas a este cliente.
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.surface, textAlign: 'left' }}>
                    {['Proyecto / Empresa', 'Unidad', 'Monto', 'Etapa', 'Fecha'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', color: C.textDim, fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientOpps.map((o) => {
                    const stageColor = getStageColor(o.stage);
                    return (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600 }}>{o.projectName || o.company}</div>
                          {o.projectName && <div style={{ fontSize: 11, color: C.textDim }}>{o.company}</div>}
                        </td>
                        <td style={{ padding: '11px 14px', verticalAlign: 'middle', color: C.textDim, fontSize: 12 }}>{o.businessUnit}</td>
                        <td style={{ padding: '11px 14px', verticalAlign: 'middle', fontFamily: 'Space Mono', fontWeight: 700, color: stageColor }}>{fmt(Number(o.amount) || 0)}</td>
                        <td style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 11, background: stageColor + '20', color: stageColor, borderRadius: 6, padding: '2px 8px' }}>{o.stage}</span>
                        </td>
                        <td style={{ padding: '11px 14px', verticalAlign: 'middle', color: C.textDim }}>{o.createdAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Stubs for future modules */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            {[
              { title: 'Proyectos ejecutados', icon: '📋', module: 'Ventas' },
              { title: 'Facturas emitidas', icon: '🧾', module: 'Ventas' },
            ].map((s) => (
              <div key={s.title} style={{ background: C.card, borderRadius: 12, padding: 24, border: `1px solid ${C.border}`, textAlign: 'center', color: C.textDim }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11 }}>Disponible con el módulo de {s.module}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <ClientModal
          client={client}
          onSave={async (data) => { await updateClient.mutateAsync({ id: client.id, ...data }); }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
