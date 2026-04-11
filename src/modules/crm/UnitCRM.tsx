import { useState, useMemo } from 'react';
import { useConfig } from './context';
import { Dashboard } from './components/Dashboard';
import { KanbanView } from './components/KanbanView';
import { ListView } from './components/ListView';
import { AnalyticsView } from './components/AnalyticsView';
import { OppModal } from './components/OppModal';
import { CancelReasonModal } from './components/CancelReasonModal';
import { CalendarConfirmModal } from './components/CalendarConfirmModal';
import { AmountPromptModal } from './components/AmountPromptModal';
import { emptyFilters } from './components/InlineFilters';
import {
  C, btnPrimary, DEFAULT_STAGES, TABS,
  QUOTED_STAGE, CONFIRMED_STAGE, CANCELLED_STAGE, WON_STAGE,
  hasValidAmount, inSizeRange, today,
} from '@/styles/theme';
import type { Opportunity, User } from '@/types';
import type { Filters } from './components/InlineFilters';
import type { AmountPrompt } from './components/AmountPromptModal';

interface UnitCRMProps {
  businessUnit: string;
  opps: Opportunity[];
  addOpp: (data: Partial<Opportunity>) => Promise<void>;
  updateOpp: (data: Opportunity) => Promise<void>;
  deleteOpp: (id: string) => Promise<void>;
  moveStage: (id: string, stage: string, reason?: string) => Promise<void>;
  user: User;
}

type ModalState =
  | { type: 'new' }
  | { type: 'edit'; opp: Opportunity }
  | { type: 'cancel'; opp: Opportunity }
  | null;

export function UnitCRM({ businessUnit, opps, addOpp, updateOpp, deleteOpp, moveStage, user }: UnitCRMProps) {
  const { config } = useConfig();
  const [tab, setTab] = useState<string>('dashboard');
  const [modal, setModal] = useState<ModalState>(null);
  const [calendarPrompt, setCalendarPrompt] = useState<Opportunity | null>(null);
  const [amountPrompt, setAmountPrompt] = useState<AmountPrompt | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  const missingEventFields = (opp: Partial<Opportunity>): string[] => {
    const missing: string[] = [];
    if (!opp?.eventDateTime) missing.push('fecha del evento');
    if (!opp?.startTime) missing.push('hora de inicio');
    if (!opp?.endTime) missing.push('hora de fin');
    return missing;
  };

  const moveStageWithCalendar = async (id: string, newStage: string, reason?: string, skipAmountCheck = false) => {
    const prevOpp = opps.find((o) => o.id === id);
    if (!prevOpp) return;

    // Block moving to "Cerrado Ganado" without a client profile
    if (newStage === WON_STAGE && !prevOpp.clientId) {
      alert('Para cerrar esta oportunidad necesitas vincular un perfil de cliente con datos fiscales completos (RFC, régimen fiscal, uso de CFDI y dirección fiscal).');
      return;
    }

    const movingToQuoted = newStage === QUOTED_STAGE && prevOpp.stage !== QUOTED_STAGE;
    const movingToConfirmed = newStage === CONFIRMED_STAGE && prevOpp.stage !== CONFIRMED_STAGE;

    if (!skipAmountCheck) {
      if (movingToQuoted && !hasValidAmount(prevOpp)) {
        setAmountPrompt({ oppId: id, targetStage: QUOTED_STAGE, currentAmount: prevOpp.amount || '', mode: 'set', reason });
        return;
      }
      if (movingToConfirmed) {
        setAmountPrompt({ oppId: id, targetStage: CONFIRMED_STAGE, currentAmount: prevOpp.amount || '', mode: hasValidAmount(prevOpp) ? 'confirm' : 'set', reason });
        return;
      }
    }

    const movingToConfirmedEventos = movingToConfirmed && businessUnit === 'eventos';
    if (movingToConfirmedEventos) {
      const missing = missingEventFields(prevOpp);
      if (missing.length) {
        alert(`No se puede mover a Confirmado sin: ${missing.join(', ')}.\n\nAbre la oportunidad y completa estos campos.`);
        setModal({ type: 'edit', opp: prevOpp });
        return;
      }
    }

    await moveStage(id, newStage, reason);

    if (movingToConfirmedEventos) {
      const opp = opps.find((o) => o.id === id);
      if (opp) setCalendarPrompt({ ...opp, stage: CONFIRMED_STAGE });
    }
  };

  const onAmountPromptConfirm = async (newAmountStr: string) => {
    if (!amountPrompt) return;
    const { oppId, targetStage, reason } = amountPrompt;
    const opp = opps.find((o) => o.id === oppId);
    if (!opp) { setAmountPrompt(null); return; }

    const newAmount = String(newAmountStr || '').trim();
    const numericAmount = Number(newAmount);
    if (!newAmount || isNaN(numericAmount) || numericAmount <= 0) {
      alert('El monto debe ser un número mayor que 0.');
      return;
    }

    if (targetStage === CONFIRMED_STAGE && businessUnit === 'eventos') {
      const missing = missingEventFields(opp);
      if (missing.length) {
        alert(`No se puede mover a Confirmado sin: ${missing.join(', ')}.\n\nSe guardará el monto pero debes completar esos campos.`);
        const updatedAmtOnly = { ...opp, amount: newAmount };
        await updateOpp(updatedAmtOnly);
        setAmountPrompt(null);
        setModal({ type: 'edit', opp: updatedAmtOnly });
        return;
      }
    }

    const updated: Opportunity = {
      ...opp,
      amount: newAmount,
      stage: targetStage,
      lostReason: reason || opp.lostReason,
      history: [...(opp.history || []), { stage: targetStage, date: today() }],
    };
    await updateOpp(updated);
    setAmountPrompt(null);

    if (targetStage === CONFIRMED_STAGE && businessUnit === 'eventos') {
      setCalendarPrompt({ ...updated });
    }
  };

  const filtered = useMemo(() => {
    return opps.filter((o) => {
      if (filters.stage && o.stage !== filters.stage) return false;
      if (filters.priority && o.priority !== filters.priority) return false;
      if (filters.salesperson && o.salesperson !== filters.salesperson) return false;
      if (filters.orgType && o.orgType !== filters.orgType) return false;
      if (filters.sizeRange && !inSizeRange(o.attendees, filters.sizeRange)) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          o.company?.toLowerCase().includes(s) ||
          o.contact?.toLowerCase().includes(s) ||
          o.projectName?.toLowerCase().includes(s) ||
          o.salesperson?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [opps, filters]);

  const handleSave = async (data: Partial<Opportunity>) => {
    const prevOpp = modal && 'opp' in modal ? modal.opp : undefined;
    const wasConfirmed = prevOpp?.stage === CONFIRMED_STAGE;
    const movingToConfirmed = data.stage === CONFIRMED_STAGE && !wasConfirmed;
    const movingToConfirmedEventos = movingToConfirmed && businessUnit === 'eventos';

    if (data.stage === WON_STAGE && !data.clientId) {
      alert('Para cerrar esta oportunidad necesitas vincular un perfil de cliente con datos fiscales completos (RFC, régimen fiscal, uso de CFDI y dirección fiscal).');
      return;
    }

    if (data.stage === QUOTED_STAGE && !hasValidAmount(data)) {
      alert('Para mover la oportunidad a Cotizado tienes que ingresar un monto mayor que $0.');
      return;
    }

    if (movingToConfirmed && !hasValidAmount(data)) {
      alert('Para mover la oportunidad a Confirmado tienes que tener un monto cotizado mayor que $0.');
      return;
    }

    if (movingToConfirmed) {
      const n = Number(data.amount);
      const ok = window.confirm(`Vas a confirmar esta oportunidad con un monto de $${n.toLocaleString()} MXN.\n\n¿Es correcto el monto?`);
      if (!ok) return;
    }

    if (movingToConfirmedEventos) {
      const missing = missingEventFields(data);
      if (missing.length) {
        alert(`No se puede mover a Confirmado sin: ${missing.join(', ')}.\n\nCompleta estos campos antes de guardar.`);
        return;
      }
    }

    if (prevOpp) await updateOpp({ ...prevOpp, ...data, businessUnit } as Opportunity);
    else await addOpp(data);
    setModal(null);

    if (movingToConfirmedEventos) {
      setCalendarPrompt({ ...data, businessUnit, stage: CONFIRMED_STAGE } as Opportunity);
    }
  };

  const stages = config.stages || DEFAULT_STAGES;

  return (
    <div>
      {/* Sub-header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 56, zIndex: 39,
        flexWrap: 'wrap', gap: 8,
      }}>
        <nav style={{ display: 'flex', gap: 2, padding: '8px 0' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? C.accentDim : 'transparent',
                color: tab === t.id ? C.accent : C.textDim,
                border: 'none', borderRadius: 8, padding: '6px 12px',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setModal({ type: 'new' })} style={{ ...btnPrimary, fontSize: 12, padding: '6px 14px' }}>
          + Oportunidad
        </button>
      </div>

      {/* Content */}
      <main style={{ padding: 24 }}>
        {tab === 'dashboard' && <Dashboard opps={filtered} filters={filters} setFilters={setFilters} allOpps={opps} />}
        {tab === 'kanban' && (
          <KanbanView opps={filtered} moveStage={moveStageWithCalendar}
            onEdit={(o) => setModal({ type: 'edit', opp: o })} setModal={setModal}
            filters={filters} setFilters={setFilters} allOpps={opps} />
        )}
        {tab === 'list' && (
          <ListView opps={filtered} onEdit={(o) => setModal({ type: 'edit', opp: o })}
            onDelete={deleteOpp} moveStage={moveStageWithCalendar} setModal={setModal}
            filters={filters} setFilters={setFilters} allOpps={opps} />
        )}
        {tab === 'analytics' && <AnalyticsView opps={filtered} filters={filters} setFilters={setFilters} allOpps={opps} />}
      </main>

      {/* Modals */}
      {modal && modal.type !== 'cancel' && (
        <OppModal
          opp={modal.type === 'edit' ? modal.opp : undefined}
          businessUnit={businessUnit}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onDelete={modal.type === 'edit' ? () => { deleteOpp(modal.opp.id); setModal(null); } : undefined}
          defaultSalesperson={user.name}
          moveStage={moveStageWithCalendar}
          setModal={setModal}
        />
      )}
      {modal?.type === 'cancel' && (
        <CancelReasonModal
          opp={modal.opp}
          onSave={(reason) => { moveStageWithCalendar(modal.opp.id, CANCELLED_STAGE, reason); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {amountPrompt && (
        <AmountPromptModal
          prompt={amountPrompt}
          opp={opps.find((o) => o.id === amountPrompt.oppId)}
          onConfirm={onAmountPromptConfirm}
          onClose={() => setAmountPrompt(null)}
        />
      )}
      {calendarPrompt && (
        <CalendarConfirmModal
          opp={calendarPrompt}
          onClose={() => setCalendarPrompt(null)}
          onSuccess={async (eventId, eventUrl) => {
            const current = opps.find((o) => o.id === calendarPrompt.id) || calendarPrompt;
            await updateOpp({ ...current, businessUnit, stage: CONFIRMED_STAGE, gcalEventId: eventId, gcalEventUrl: eventUrl });
            setCalendarPrompt(null);
          }}
        />
      )}
    </div>
  );
}
