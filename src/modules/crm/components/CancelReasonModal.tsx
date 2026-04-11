import { useState } from 'react';
import { useConfig } from '@/modules/crm/context';
import { Overlay } from '@/components/Overlay';
import { C, inputStyle, btnPrimary, btnSecondary, LOST_REASONS } from '@/styles/theme';
import type { Opportunity } from '@/types';

interface CancelReasonModalProps {
  opp: Opportunity;
  onSave: (reason: string) => void;
  onClose: () => void;
}

export function CancelReasonModal({ opp, onSave, onClose }: CancelReasonModalProps) {
  const { config } = useConfig();
  const reasons = config.lostReasons || LOST_REASONS;
  const [reason, setReason] = useState(reasons[0]);
  const [custom, setCustom] = useState('');

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 400 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: C.danger }}>Oportunidad Cancelada</h3>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16 }}>
          ¿Cuál fue la razón por la que se canceló <b>{opp?.projectName || opp?.company}</b>?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {reasons.map((r) => (
            <label key={r} style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13,
              padding: '6px 10px', borderRadius: 8,
              background: reason === r ? C.dangerDim : 'transparent',
              border: `1px solid ${reason === r ? C.danger : C.border}`,
              transition: 'all .15s',
            }}>
              <input type="radio" name="cr" checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: C.danger }} />
              {r}
            </label>
          ))}
        </div>
        {reason === 'Otro' && (
          <input placeholder="Especifica la razón" value={custom} onChange={(e) => setCustom(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSave(reason === 'Otro' ? custom || 'Otro' : reason)}
            style={{ ...btnPrimary, background: C.danger }}>
            Marcar como Cancelada
          </button>
        </div>
      </div>
    </Overlay>
  );
}
