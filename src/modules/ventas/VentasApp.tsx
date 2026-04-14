import { useState } from 'react';
import { FacturacionView } from './views/FacturacionView';
import { CobranzaView } from './views/CobranzaView';
import { ProjectDetail } from './views/ProjectDetail';
import { SalesDashboard } from './views/SalesDashboard';
import { C } from '@/styles/theme';

type VentasView = 'dashboard' | 'facturacion' | 'cobranza';

const NAV_ITEMS: { id: VentasView; label: string; icon: string }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '📊' },
  { id: 'facturacion',  label: 'Facturación',  icon: '🧾' },
  { id: 'cobranza',     label: 'Cobranza',     icon: '💰' },
];

export function VentasApp() {
  const [view, setView] = useState<VentasView>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const navItem = (item: typeof NAV_ITEMS[0]) => {
    const active = view === item.id && !selectedProjectId;
    return (
      <button key={item.id}
        onClick={() => { setView(item.id); setSelectedProjectId(null); }}
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
          Ventas
        </div>
        {NAV_ITEMS.map(navItem)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedProjectId ? (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
          />
        ) : (
          <>
            {view === 'dashboard'   && <SalesDashboard />}
            {view === 'facturacion' && <FacturacionView onSelectProject={setSelectedProjectId} />}
            {view === 'cobranza'    && <CobranzaView />}
          </>
        )}
      </div>
    </div>
  );
}
