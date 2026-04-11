import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import { C, btnPrimary, btnSecondary, GCAL_WEBHOOK_URL } from '@/styles/theme';
import type { Opportunity } from '@/types';

type Status = 'idle' | 'sending' | 'success' | 'error';

interface CalendarConfirmModalProps {
  opp: Opportunity;
  onClose: () => void;
  onSuccess: (eventId: string, eventUrl: string) => void;
}

export function CalendarConfirmModal({ opp, onClose, onSuccess }: CalendarConfirmModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const hasValidDate = !!(opp?.eventDateTime);

  const sendToCalendar = async () => {
    if (!GCAL_WEBHOOK_URL) {
      setStatus('error');
      setErrorMsg('No hay URL del Web App configurada. Configura VITE_GCAL_WEBHOOK_URL en .env');
      return;
    }
    setStatus('sending');
    try {
      const payload = {
        id: opp.id,
        title: opp.projectName || opp.company || 'Evento',
        company: opp.company || '',
        contact: opp.contact || '',
        salesperson: opp.salesperson || '',
        attendees: opp.attendees || '',
        notes: opp.notes || '',
        eventDate: opp.eventDateTime ? opp.eventDateTime.slice(0, 10) : '',
        startTime: opp.startTime || '',
        endTime: opp.endTime || '',
      };
      const response = await fetch(GCAL_WEBHOOK_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.ok) {
        setStatus('success');
        setTimeout(() => onSuccess(result.eventId, result.eventUrl), 1200);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message || String(err));
    }
  };

  return (
    <Overlay onClose={status === 'sending' ? () => {} : onClose}>
      <div style={{ width: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Evento Confirmado</h3>
        <p style={{ color: C.textDim, fontSize: 13, margin: '0 0 12px' }}>
          <strong style={{ color: C.text }}>{opp.projectName || opp.company}</strong> ha sido confirmado.
          <br />¿Enviarlo a Google Calendar?
        </p>
        <div style={{ background: C.card, borderRadius: 8, padding: 12, margin: '0 0 16px', textAlign: 'left', fontSize: 12, color: C.textDim }}>
          {opp.company && <div>🏢 <strong style={{ color: C.text }}>{opp.company}</strong></div>}
          {opp.contact && <div>👤 {opp.contact}</div>}
          {hasValidDate && (
            <div>
              📆 {opp.eventDateTime!.slice(0, 10)}
              {opp.startTime && ` · ${opp.startTime}`}
              {opp.endTime && ` – ${opp.endTime}`}
            </div>
          )}
          {!hasValidDate && <div style={{ color: C.warn }}>⚠ Sin fecha del evento</div>}
          {opp.attendees && <div>👥 {opp.attendees} asistentes</div>}
        </div>
        {status === 'success' && (
          <div style={{ color: C.success, fontSize: 13, marginBottom: 12 }}>✓ Evento creado exitosamente en Google Calendar</div>
        )}
        {status === 'error' && (
          <div style={{ color: C.danger, fontSize: 12, marginBottom: 12, background: C.dangerDim, padding: '8px 12px', borderRadius: 6 }}>
            Error: {errorMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {status === 'idle' && (
            <>
              <button onClick={onClose} style={btnSecondary}>No enviar</button>
              <button onClick={sendToCalendar} style={btnPrimary}>✓ Sí, enviar al Calendar</button>
            </>
          )}
          {status === 'sending' && <button disabled style={{ ...btnPrimary, opacity: 0.6 }}>Enviando...</button>}
          {status === 'error' && (
            <>
              <button onClick={onClose} style={btnSecondary}>Cerrar</button>
              <button onClick={sendToCalendar} style={btnPrimary}>Reintentar</button>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}
