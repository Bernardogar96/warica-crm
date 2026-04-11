import { useIsMobile } from '@/hooks/useIsMobile';
import { C, BUSINESS_UNITS } from '@/styles/theme';

interface SidebarProps {
  businessUnit: string;
  onSelect: (unitId: string) => void;
  mainView: string;
  onClientsClick: () => void;
}

export function Sidebar({ businessUnit, onSelect, mainView, onClientsClick }: SidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: 'flex', overflowX: 'auto', padding: '8px 12px', gap: 6,
        position: 'sticky', top: 56, zIndex: 40,
      }}>
        {BUSINESS_UNITS.map((u) => {
          const active = mainView === 'unit' && businessUnit === u.id;
          return (
            <button key={u.id} onClick={() => onSelect(u.id)}
              style={{
                background: active ? C.accentDim : 'transparent',
                color: active ? C.accent : C.textDim,
                border: `1px solid ${active ? C.accent : C.border}`,
                borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              {u.logo
                ? <img src={u.logo} alt="" style={{ height: 20, width: 20, objectFit: 'contain', borderRadius: 4 }} />
                : <span>{u.icon}</span>}
              {u.label}
            </button>
          );
        })}
        <button onClick={onClientsClick}
          style={{
            background: mainView === 'clients' ? C.accentDim : 'transparent',
            color: mainView === 'clients' ? C.accent : C.textDim,
            border: `1px solid ${mainView === 'clients' ? C.accent : C.border}`,
            borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          🏢 Clientes
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: 200, background: C.surface, borderRight: `1px solid ${C.border}`,
      padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 2,
      position: 'sticky', top: 56, alignSelf: 'flex-start',
      height: 'calc(100vh - 56px)', overflowY: 'auto',
    }}>
      <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', marginBottom: 4 }}>
        Unidades de negocio
      </div>
      {BUSINESS_UNITS.map((u) => {
        const active = mainView === 'unit' && businessUnit === u.id;
        return (
          <button key={u.id} onClick={() => onSelect(u.id)}
            style={{
              background: active ? C.accentDim : 'transparent',
              color: active ? C.accent : C.textDim,
              border: 'none', borderRadius: 8, padding: '10px 12px',
              cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
              fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            {u.logo
              ? <img src={u.logo} alt="" style={{ height: 28, width: 28, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
              : <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>{u.icon}</span>}
            <span style={{ lineHeight: 1.3 }}>{u.label}</span>
          </button>
        );
      })}
      {/* CRM section */}
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', marginBottom: 4 }}>
          CRM
        </div>
        <button onClick={onClientsClick}
          style={{
            background: mainView === 'clients' ? C.accentDim : 'transparent',
            color: mainView === 'clients' ? C.accent : C.textDim,
            border: 'none', borderRadius: 8, padding: '10px 12px',
            cursor: 'pointer', fontSize: 13, fontWeight: mainView === 'clients' ? 600 : 400,
            fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          }}>
          <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>🏢</span>
          <span>Clientes</span>
        </button>
      </div>
    </div>
  );
}
