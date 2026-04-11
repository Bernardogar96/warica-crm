import { useState } from 'react';
import { C, inputSmall, btnPrimary, btnSmall, today, uid } from '@/styles/theme';
import type { Activity } from '@/types';

interface ActivitiesPanelProps {
  activities: Activity[];
  onUpdate: (acts: Activity[]) => void;
}

const COLS = [
  { id: 'backlog' as const, label: 'Backlog', color: '#a8a295' },
  { id: 'en_proceso' as const, label: 'En Proceso', color: '#c15f3c' },
  { id: 'completada' as const, label: 'Completada', color: '#5e7a45' },
];

export function ActivitiesPanel({ activities, onUpdate }: ActivitiesPanelProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');

  const pending = activities.filter((a) => a.status !== 'completada');
  const overdue = pending.filter((a) => a.dueDate && a.dueDate < today());
  const statusColor = overdue.length > 0 ? C.danger : C.success;
  const statusLabel =
    overdue.length > 0
      ? `⚠ ${overdue.length} tarea${overdue.length > 1 ? 's' : ''} tarde`
      : '✓ A tiempo';

  const addActivity = () => {
    if (!newTitle.trim()) return;
    const act: Activity = { id: uid(), title: newTitle.trim(), status: 'backlog', dueDate: newDue, createdAt: today() };
    onUpdate([...activities, act]);
    setNewTitle(''); setNewDue('');
  };

  const moveActivity = (actId: string, newStatus: Activity['status']) =>
    onUpdate(activities.map((a) => (a.id === actId ? { ...a, status: newStatus } : a)));

  const deleteActivity = (actId: string) =>
    onUpdate(activities.filter((a) => a.id !== actId));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: statusColor, background: statusColor + '20', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
          {statusLabel}
        </span>
        <span style={{ color: C.textDim, fontSize: 12 }}>
          {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva tarea..." style={{ ...inputSmall, flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && addActivity()} />
        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
          style={{ ...inputSmall, width: 130 }} title="Fecha límite (opcional)" />
        <button onClick={addActivity} style={{ ...btnPrimary, padding: '5px 12px', fontSize: 12 }}>+</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {COLS.map((col) => (
          <div key={col.id} style={{ background: C.card, borderRadius: 8, padding: 8, minHeight: 80 }}>
            <div style={{ fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
              {col.label}
            </div>
            {activities
              .filter((a) => (a.status || 'backlog') === col.id)
              .map((act) => {
                const isOverdue = act.dueDate && act.dueDate < today() && col.id !== 'completada';
                return (
                  <div key={act.id} style={{
                    background: C.surface, borderRadius: 6, padding: '6px 8px', marginBottom: 4, fontSize: 12,
                    borderLeft: `2px solid ${isOverdue ? C.danger : col.color}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ flex: 1, lineHeight: 1.3, color: isOverdue ? C.danger : C.text }}>{act.title}</span>
                      <button onClick={() => deleteActivity(act.id)}
                        style={{ ...btnSmall, color: C.textDim, fontSize: 10, padding: '0 2px', lineHeight: 1 }}>×</button>
                    </div>
                    {act.dueDate && (
                      <div style={{ fontSize: 10, color: isOverdue ? C.danger : C.textDim, marginTop: 2 }}>
                        {isOverdue ? '⚠ ' : ''}{act.dueDate}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                      {COLS.filter((c) => c.id !== col.id).map((c) => (
                        <button key={c.id} onClick={() => moveActivity(act.id, c.id)}
                          style={{ ...btnSmall, fontSize: 9, background: c.color + '20', color: c.color, borderRadius: 4, padding: '1px 5px' }}>
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
