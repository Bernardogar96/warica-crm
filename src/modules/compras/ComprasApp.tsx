import { useState } from 'react';
import { SuppliersView } from './views/SuppliersView';
import { PurchaseRequestsView } from './views/PurchaseRequestsView';
import { C } from '@/styles/theme';
import type { User } from '@/types';

type ComprasView = 'requests' | 'suppliers';

const NAV_ITEMS: { id: ComprasView; label: string; icon: string }[] = [
  { id: 'requests', label: 'Solicitudes', icon: '🛒' },
  { id: 'suppliers', label: 'Proveedores', icon: '🏭' },
];

interface Props { user: User; }

export function ComprasApp({ user }: Props) {
  const [view, setView] = useState<ComprasView>('requests');

  const navItem = (item: typeof NAV_ITEMS[0]) => {
    const active = view === item.id;
    return (
      <button key={item.id} onClick={() => setView(item.id)}
        style={{
          background: active ? C.accentDim : 'transparent',
          color: active ? C.accent : C.textDim,
          border: 'none', borderRadius: 8, padding: '8px 14px',
          cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
        }}>
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{
        width: 180, background: C.surface, borderRight: `1px solid ${C.border}`,
        padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 2,
        position: 'sticky', top: 56, alignSelf: 'flex-start', height: 'calc(100vh - 56px)',
      }}>
        <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', marginBottom: 4 }}>
          Compras
        </div>
        {NAV_ITEMS.map(navItem)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {view === 'requests' && <PurchaseRequestsView userId={user.userId} />}
        {view === 'suppliers' && <SuppliersView />}
      </div>
    </div>
  );
}
