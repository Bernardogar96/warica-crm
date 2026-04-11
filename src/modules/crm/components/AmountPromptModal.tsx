import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import { C, inputStyle, btnPrimary, btnSecondary, fmt, getStageColor, QUOTED_STAGE } from '@/styles/theme';
import type { Opportunity } from '@/types';

export interface AmountPrompt {
  oppId: string;
  targetStage: string;
  currentAmount: string;
  mode: 'set' | 'confirm';
  reason?: string;
}

interface AmountPromptModalProps {
  prompt: AmountPrompt;
  opp: Opportunity | undefined;
  onConfirm: (amount: string) => Promise<void>;
  onClose: () => void;
}

export function AmountPromptModal({ prompt, opp, onConfirm, onClose }: AmountPromptModalProps) {
  const { targetStage, mode, currentAmount } = prompt;
  const [value, setValue] = useState(currentAmount || '');
  const [submitting, setSubmitting] = useState(false);

  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  const isValid = !isNaN(numeric) && numeric > 0;

  const handleConfirm = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(String(numeric));
    } finally {
      setSubmitting(false);
    }
  };

  const isCotizado = targetStage === QUOTED_STAGE;
  const title = isCotizado ? 'Monto cotizado' : 'Confirmar monto';
  const subtitle = isCotizado
    ? 'Para mover la oportunidad a Cotizado, ingresa el monto de la cotización.'
    : mode === 'confirm'
      ? 'Estás por confirmar esta oportunidad. Verifica que el monto sea el correcto antes de continuar.'
      : 'Antes de confirmar, ingresa el monto final acordado.';
  const icon = isCotizado ? '💰' : '✓';
  const stageColor = getStageColor(targetStage);
  const label = opp?.projectName || opp?.company || 'esta oportunidad';

  return (
    <Overlay onClose={submitting ? () => {} : onClose}>
      <div style={{ width: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: C.textStrong }}>{title}</h3>
        <p style={{ color: C.textDim, fontSize: 13, margin: '0 0 4px' }}>
          <strong style={{ color: C.text }}>{label}</strong>
        </p>
        <p style={{ color: C.textDim, fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>{subtitle}</p>
        <div style={{ background: C.card, borderRadius: 10, padding: 14, margin: '0 0 16px', border: `1px solid ${C.border}`, textAlign: 'left' }}>
          <label style={{ fontSize: 11, color: C.textDim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Monto (MXN)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, color: C.textDim, fontWeight: 600 }}>$</span>
            <input type="text" inputMode="decimal" autoFocus value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              placeholder="0"
              style={{ ...inputStyle, fontSize: 20, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: stageColor, padding: '10px 12px' }}
            />
          </div>
          {isValid && <div style={{ marginTop: 8, fontSize: 12, color: C.textDim }}>{fmt(numeric)} MXN</div>}
          {!isValid && value && <div style={{ marginTop: 8, fontSize: 12, color: C.danger }}>Ingresa un monto mayor que $0.</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={onClose} disabled={submitting} style={{ ...btnSecondary, opacity: submitting ? 0.6 : 1 }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!isValid || submitting}
            style={{ ...btnPrimary, opacity: !isValid || submitting ? 0.5 : 1, cursor: !isValid || submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Guardando...' : isCotizado ? '✓ Guardar y mover a Cotizado' : '✓ Confirmar oportunidad'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
