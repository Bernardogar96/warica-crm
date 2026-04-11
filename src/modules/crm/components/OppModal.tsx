import { useState } from 'react';
import { useConfig } from '@/modules/crm/context';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import { ActivitiesPanel } from './ActivitiesPanel';
import { LinkClientModal } from './LinkClientModal';
import { ClientModal } from './ClientModal';
import { useClient, useCreateClient } from '@/modules/crm/hooks/useClients';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  C, inputStyle, btnPrimary, btnSecondary, btnSmall,
  DEFAULT_STAGES, PRIORITIES, PRIORITY_COLOR, OPP_STATUSES, ORG_TYPES,
  today, emptyOpp, WON_STAGE,
} from '@/styles/theme';
import type { Opportunity, Activity, Client } from '@/types';

interface OppModalProps {
  opp?: Opportunity;
  businessUnit: string;
  onSave: (data: Partial<Opportunity>) => void;
  onClose: () => void;
  onDelete?: () => void;
  defaultSalesperson: string;
  moveStage: (id: string, stage: string, reason?: string) => void;
  setModal: (m: { type: string; opp?: Opportunity } | null) => void;
}

export function OppModal({ opp, businessUnit, onSave, onClose, onDelete, defaultSalesperson, moveStage, setModal }: OppModalProps) {
  const { config } = useConfig();
  const stages = config.stages || DEFAULT_STAGES;
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'history'>('details');
  const [form, setForm] = useState<Partial<Opportunity>>(opp || emptyOpp(businessUnit, defaultSalesperson, stages));
  const set = <K extends keyof Opportunity>(k: K, v: Opportunity[K]) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!opp;
  const isEventos = businessUnit === 'eventos';

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const { data: linkedClient } = useClient(form.clientId);
  const createClient = useCreateClient();

  const getHistoryDate = (stage: string) => {
    if (stage === stages[0]) return form.createdAt || '';
    const history = form.history || [];
    return (
      [...history].reverse().find((e) => e.stage === stage)?.date ||
      history.find((e) => e.stage === stage)?.date || ''
    );
  };

  const setHistoryDate = (stage: string, date: string) => {
    if (stage === stages[0]) { set('createdAt', date); return; }
    const h = [...(form.history || [])];
    const idx = h.findIndex((e) => e.stage === stage);
    if (idx >= 0) h[idx] = { ...h[idx], date };
    else h.push({ stage, date });
    set('history', h);
  };

  const currentStageIdx = stages.indexOf(form.stage || '');
  const stagesInHistory = currentStageIdx >= 0 ? stages.slice(0, currentStageIdx + 1) : stages.slice(0, 1);

  const handleSave = () => {
    if (!form.company && !form.projectName) return;

    // Block moving to "Cerrado Ganado" without a client profile linked
    if (form.stage === WON_STAGE && !form.clientId) {
      alert(
        'Para cerrar esta oportunidad necesitas vincular un perfil de cliente con datos fiscales completos (RFC, régimen fiscal, uso de CFDI y dirección fiscal).',
      );
      return;
    }

    onSave(form);
  };

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button onClick={() => setActiveTab(id)}
      style={{
        background: activeTab === id ? C.accentDim : 'transparent',
        color: activeTab === id ? C.accent : C.textDim,
        border: 'none', borderRadius: 8, padding: '6px 14px',
        cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
      }}>
      {label}
    </button>
  );

  const currentStatus = OPP_STATUSES.find((s) => s.value === (form.status || 'a_tiempo')) || OPP_STATUSES[0];
  const currentPriorityColor = PRIORITY_COLOR[form.priority || 'Media'] || C.textDim;

  return (
    <>
    <Overlay onClose={onClose}>
      <div style={{ width: isMobile ? '100%' : 580 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {isEdit ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
          </h3>
          <select value={form.priority || 'Media'} onChange={(e) => set('priority', e.target.value as Opportunity['priority'])}
            style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, border: `1px solid ${currentPriorityColor}40`, background: currentPriorityColor + '20', color: currentPriorityColor, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
            {PRIORITIES.map((p) => <option key={p} value={p}>Prioridad {p}</option>)}
          </select>
          <select value={form.status || 'a_tiempo'} onChange={(e) => set('status', e.target.value as Opportunity['status'])}
            style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, border: `1px solid ${currentStatus.color}40`, background: currentStatus.color + '20', color: currentStatus.color, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
            {OPP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
          </select>
        </div>

        {/* Client section */}
        {linkedClient ? (
          <div style={{ background: C.successDim, border: `1px solid ${C.success}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🏢</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{linkedClient.tradeName}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>{linkedClient.rfc || 'Sin RFC'}</div>
            </div>
            <button onClick={() => set('clientId', undefined as unknown as string)} style={{ ...btnSmall, color: C.textDim, fontSize: 11 }}>
              Desvincular
            </button>
          </div>
        ) : (
          <div style={{ background: C.warnDim, border: `1px solid ${C.warn}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: C.warn }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>⚠</span>
              <span style={{ flex: 1 }}>Esta oportunidad no tiene un perfil de cliente vinculado.</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLinkModal(true)}
                style={{ ...btnSmall, background: C.warn + '20', color: C.warn, border: `1px solid ${C.warn}40`, borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>
                Vincular cliente existente
              </button>
              <button onClick={() => setShowCreateClient(true)}
                style={{ ...btnSmall, background: C.warn + '20', color: C.warn, border: `1px solid ${C.warn}40`, borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>
                Crear perfil de cliente
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          {tabBtn('details', 'Detalles')}
          {tabBtn('activities', 'Actividades')}
          {isEdit && tabBtn('history', 'Historial')}
        </div>

        {/* Details tab */}
        {activeTab === 'details' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              {isEventos && (
                <Field label="Nombre del proyecto">
                  <input value={form.projectName || ''} onChange={(e) => set('projectName', e.target.value)}
                    style={inputStyle} placeholder="Nombre del evento" />
                </Field>
              )}
              <Field label="Empresa / Cliente">
                <input value={form.company || ''} onChange={(e) => set('company', e.target.value)}
                  style={inputStyle} placeholder="Nombre de empresa" />
              </Field>
              <Field label="Contacto">
                <input value={form.contact || ''} onChange={(e) => set('contact', e.target.value)}
                  style={inputStyle} placeholder="Nombre del contacto" />
              </Field>
              <Field label="Vendedor">
                <input value={form.salesperson || ''} onChange={(e) => set('salesperson', e.target.value)}
                  style={inputStyle} placeholder="Nombre del vendedor" />
              </Field>
              {isEventos && (
                <Field label="Fecha del evento">
                  <input type="date" value={form.eventDateTime ? form.eventDateTime.slice(0, 10) : ''}
                    onChange={(e) => set('eventDateTime', e.target.value)} style={inputStyle} />
                </Field>
              )}
              {isEventos && (
                <Field label="# de asistentes">
                  <input type="number" value={form.attendees || ''} onChange={(e) => set('attendees', e.target.value)}
                    style={inputStyle} placeholder="0" min="0" />
                </Field>
              )}
              <Field label="Tipo de organización">
                <select value={form.orgType || ''} onChange={(e) => set('orgType', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Monto (MXN)">
                <input type="number" value={form.amount || ''} onChange={(e) => set('amount', e.target.value)}
                  style={inputStyle} placeholder="0" />
              </Field>
              <Field label="Fecha de creación">
                <input type="date" value={form.createdAt || today()} max={today()}
                  onChange={(e) => set('createdAt', e.target.value)} style={inputStyle} />
              </Field>
              {isEdit && (
                <Field label="Etapa">
                  <select value={form.stage || ''} onChange={(e) => set('stage', e.target.value)} style={inputStyle}>
                    {stages.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              )}
              {isEventos && (
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Hora de inicio">
                    <input type="time" value={form.startTime || ''} onChange={(e) => set('startTime', e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Hora de fin">
                    <input type="time" value={form.endTime || ''} onChange={(e) => set('endTime', e.target.value)} style={inputStyle} />
                  </Field>
                </div>
              )}
            </div>
            <Field label="Notas">
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)}
                style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
            </Field>
          </div>
        )}

        {/* Activities tab */}
        {activeTab === 'activities' && (
          <ActivitiesPanel
            activities={form.activities || []}
            onUpdate={(acts: Activity[]) => set('activities', acts)}
          />
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Historial de etapas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stagesInHistory.map((stage) => {
                const date = getHistoryDate(stage);
                const color = C.accent;
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1, color: C.text }}>{stage}</span>
                    <input type="date" value={date} max={today()} onChange={(e) => setHistoryDate(stage, e.target.value)}
                      style={{ ...inputStyle, width: 140, padding: '3px 8px', color: date ? C.text : C.textDim }} />
                  </div>
                );
              })}
            </div>
            {(opp?.changelog || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Historial de cambios
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(opp!.changelog || []).slice().reverse().map((entry, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.textDim, padding: '4px 8px', background: C.card, borderRadius: 6 }}>
                      <span style={{ color: C.text }}>{entry.date}</span> — {entry.field}: <span style={{ color: C.danger }}>{entry.from}</span> → <span style={{ color: C.success }}>{entry.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isEdit && onDelete && <button onClick={onDelete} style={{ ...btnSmall, color: C.danger }}>Eliminar</button>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} style={btnPrimary}>{isEdit ? 'Guardar' : 'Crear'}</button>
          </div>
        </div>
      </div>
    </Overlay>

    {/* Sub-modals for client linking — rendered outside Overlay to stack on top */}
    {showLinkModal && (
      <LinkClientModal
        onSelect={(c: Client) => { set('clientId', c.id); setShowLinkModal(false); }}
        onClose={() => setShowLinkModal(false)}
      />
    )}
    {showCreateClient && (
      <ClientModal
        prefill={{
          tradeName: form.company || '',
          contacts: form.contact ? [{ id: crypto.randomUUID(), name: form.contact, position: '', phone: '', email: '' }] : [],
        }}
        onSave={async (data) => {
          const created = await createClient.mutateAsync(data);
          set('clientId', created.id);
          setShowCreateClient(false);
        }}
        onClose={() => setShowCreateClient(false)}
      />
    )}
  </>
  );
}
