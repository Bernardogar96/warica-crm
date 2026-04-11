import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ConfigCtx } from './context';
import { Sidebar } from './Sidebar';
import { UnitCRM } from './UnitCRM';
import { ProfileView } from '@/auth/ProfileView';
import { AdminView } from '@/auth/AdminView';
import { ClientsView } from './views/ClientsView';
import { ClientDetail } from './views/ClientDetail';
import {
  C, LOGO, APP_NAME, DEFAULT_STAGES, LOST_REASONS, uid, today, emptyConfig, WON_STAGE,
} from '@/styles/theme';
import type { Opportunity, User, CrmConfig } from '@/types';

interface CRMAppProps {
  user: User;
  onLogout: () => void;
}

type MainView = 'unit' | 'profile' | 'admin' | 'clients';

export function CRMApp({ user, onLogout }: CRMAppProps) {
  const navigate = useNavigate();
  const [allOpps, setAllOpps] = useState<Opportunity[]>([]);
  const [businessUnit, setBusinessUnit] = useState('eventos');
  const [mainView, setMainView] = useState<MainView>('unit');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [config, setConfig] = useState<CrmConfig>(emptyConfig());
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    supabase.from('crm_config').select('*').eq('id', 'default').single().then(({ data }) => {
      if (data) setConfig({
        stages: data.stages || DEFAULT_STAGES,
        lostReasons: data.lost_reasons || LOST_REASONS,
      });
    });
  }, []);

  useEffect(() => {
    supabase.from('opportunities').select('id, data, client_id').then(({ data }) => {
      if (data) setAllOpps(data.map((r) => ({ ...r.data, id: r.id, clientId: r.client_id || r.data?.clientId })));
    });
    const ch = supabase.channel('opps-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, () => {
        supabase.from('opportunities').select('id, data, client_id').then(({ data }) => {
          if (data) setAllOpps(data.map((r) => ({ ...r.data, id: r.id, clientId: r.client_id || r.data?.clientId })));
        });
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const unitOpps = useMemo(
    () => allOpps.filter((o) => (o.businessUnit || 'eventos') === businessUnit),
    [allOpps, businessUnit],
  );

  const addOpp = async (data: Partial<Opportunity>) => {
    const o: Opportunity = {
      ...data as Opportunity,
      id: uid(),
      businessUnit,
      createdAt: data.createdAt || today(),
      stage: data.stage || config.stages[0],
      activities: data.activities || [],
      history: [{ stage: data.stage || config.stages[0], date: data.createdAt || today() }],
    };
    await supabase.from('opportunities').insert({
      id: o.id, data: o, client_id: o.clientId || null,
    });
    setAllOpps((prev) => [...prev, o]);
  };

  const updateOpp = async (data: Opportunity) => {
    await supabase.from('opportunities').update({
      data, client_id: data.clientId || null,
    }).eq('id', data.id);
    setAllOpps((prev) => prev.map((o) => (o.id === data.id ? { ...o, ...data } : o)));
  };

  const moveStage = async (id: string, newStage: string, reason?: string) => {
    const opp = allOpps.find((o) => o.id === id);
    if (!opp) return;
    const updated: Opportunity = {
      ...opp, stage: newStage,
      lostReason: reason || opp.lostReason,
      history: [...(opp.history || []), { stage: newStage, date: today() }],
    };
    await supabase.from('opportunities').update({ data: updated }).eq('id', id);
    setAllOpps((prev) => prev.map((o) => (o.id === id ? updated : o)));

    // Auto-create project when opportunity is won
    if (newStage === WON_STAGE && opp.clientId) {
      const existingProject = await supabase
        .from('projects').select('id').eq('opportunity_id', id).maybeSingle();
      if (!existingProject.data) {
        await supabase.from('projects').insert({
          id: uid(),
          opportunity_id: id,
          client_id: opp.clientId,
          business_unit: opp.businessUnit || 'eventos',
          project_name: opp.projectName || opp.company,
          service_type: opp.orgType || '',
          amount: Number(opp.amount) || 0,
          status: 'activo',
          start_date: today(),
        });
      }
    }
  };

  const deleteOpp = async (id: string) => {
    await supabase.from('opportunities').delete().eq('id', id);
    setAllOpps((prev) => prev.filter((o) => o.id !== id));
  };

  const goUnit = (unitId: string) => { setBusinessUnit(unitId); setMainView('unit'); };

  return (
    <ConfigCtx.Provider value={{ config, setConfig, isAdmin }}>
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '0 16px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={LOGO} alt={APP_NAME} style={{ height: 28, width: 'auto', cursor: 'pointer' }}
              onClick={() => setMainView('unit')} />
            <nav style={{ display: 'flex', gap: 2 }}>
              {[
                { path: '/crm', label: 'CRM' },
                { path: '/nomina', label: 'Nómina' },
                { path: '/ventas', label: 'Ventas' },
                { path: '/compras', label: 'Compras' },
              ].map(({ path, label }) => {
                const active = path === '/crm';
                return (
                  <button key={path} onClick={() => navigate(path)}
                    style={{
                      background: active ? C.accentDim : 'transparent',
                      color: active ? C.accent : C.textDim,
                      border: 'none', borderRadius: 8, padding: '5px 12px',
                      cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
                      fontFamily: 'inherit',
                    }}>
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div onClick={() => setMainView('profile')}
              style={{ color: mainView === 'profile' ? C.accent : C.textDim, fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: mainView === 'profile' ? C.accentDim : 'transparent' }}>
              {user.name}
            </div>
            {isAdmin && (
              <div onClick={() => setMainView('admin')}
                style={{ color: mainView === 'admin' ? C.accent : C.textDim, fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: mainView === 'admin' ? C.accentDim : 'transparent' }}>
                ⚙ Admin
              </div>
            )}
            <button onClick={onLogout}
              style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              Salir
            </button>
          </div>
        </header>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar
            businessUnit={businessUnit}
            onSelect={goUnit}
            mainView={mainView}
            onClientsClick={() => { setMainView('clients'); setSelectedClientId(null); }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {mainView === 'profile' && (
              <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
                <ProfileView user={user} />
              </div>
            )}
            {mainView === 'admin' && isAdmin && (
              <div style={{ padding: 24 }}>
                <AdminView currentUserId={user.userId} />
              </div>
            )}
            {mainView === 'unit' && (
              <UnitCRM
                key={businessUnit}
                businessUnit={businessUnit}
                opps={unitOpps}
                addOpp={addOpp}
                updateOpp={updateOpp}
                deleteOpp={deleteOpp}
                moveStage={moveStage}
                user={user}
              />
            )}
            {mainView === 'clients' && !selectedClientId && (
              <ClientsView onSelectClient={(id) => setSelectedClientId(id)} />
            )}
            {mainView === 'clients' && selectedClientId && (
              <ClientDetail
                clientId={selectedClientId}
                allOpps={allOpps}
                onBack={() => setSelectedClientId(null)}
              />
            )}
          </div>
        </div>
      </div>
    </ConfigCtx.Provider>
  );
}
