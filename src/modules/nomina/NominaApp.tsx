import { useState } from 'react';
import { EmployeesView } from './views/EmployeesView';
import { PayrollView } from './views/PayrollView';
import { PayrollDetail } from './views/PayrollDetail';
import { FiniquitoView } from './views/FiniquitoView';
import { C } from '@/styles/theme';

type NominaView = 'payroll' | 'employees' | 'finiquito';

const NAV_ITEMS: { id: NominaView; label: string; icon: string }[] = [
  { id: 'payroll', label: 'Nóminas', icon: '📋' },
  { id: 'employees', label: 'Empleados', icon: '👤' },
  { id: 'finiquito', label: 'Finiquito', icon: '🧮' },
];

export function NominaApp() {
  const [view, setView] = useState<NominaView>('payroll');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const navItem = (item: typeof NAV_ITEMS[0]) => {
    const active = view === item.id;
    return (
      <button key={item.id} onClick={() => { setView(item.id); setSelectedPeriodId(null); }}
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
      {/* Sub-sidebar */}
      <div style={{
        width: 180, background: C.surface, borderRight: `1px solid ${C.border}`,
        padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 2,
        position: 'sticky', top: 56, alignSelf: 'flex-start', height: 'calc(100vh - 56px)',
      }}>
        <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', marginBottom: 4 }}>
          Nómina
        </div>
        {NAV_ITEMS.map(navItem)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {view === 'payroll' && !selectedPeriodId && (
          <PayrollView onSelectPeriod={(id) => setSelectedPeriodId(id)} />
        )}
        {view === 'payroll' && selectedPeriodId && (
          <PayrollDetail
            periodId={selectedPeriodId}
            onBack={() => setSelectedPeriodId(null)}
          />
        )}
        {view === 'employees' && <EmployeesView />}
        {view === 'finiquito' && <FiniquitoView />}
      </div>
    </div>
  );
}
