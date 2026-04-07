import { useState, useEffect, useCallback, useMemo, useContext, createContext } from "react";
import { supabase } from "./supabase";

const LOGO = "/logo.jpeg";

const DEFAULT_STAGES = ["Primer Contacto", "Cotizado", "Negociación", "Cierre"];
const LOST_STAGE = "Perdida";
const WON_STAGE = "Ganada";

// Fallback constants (overridden by Supabase config)
const STAGES = DEFAULT_STAGES;
const ALL_STAGES = [...STAGES, WON_STAGE, LOST_STAGE];

const STAGE_PALETTE = ["#60a5fa","#a78bfa","#fbbf24","#5eead4","#fb923c","#e879f9","#38bdf8","#f472b6"];
const getStageColor = (stage, stages = STAGES) => {
  if (stage === WON_STAGE) return "#34d399";
  if (stage === LOST_STAGE) return "#f87171";
  const idx = stages.indexOf(stage);
  return STAGE_PALETTE[idx >= 0 ? idx % STAGE_PALETTE.length : 0];
};

/* ── App Config Context ── */
const ConfigCtx = createContext(null);

const ORG_TYPES = ["Empresa", "Colegio", "Gobierno", "ONG", "Asociación", "Otro"];
const SERVICE_TYPES = [
  "Integraciones Corporativas",
  "Diseño de Rutas en Montaña",
  "Limpieza de Rutas",
  "Rutas Guiadas",
  "Capacitación Outdoor",
  "Team Building",
  "Otro",
];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const LOST_REASONS = [
  "Precio muy alto",
  "Eligió competencia",
  "Sin presupuesto",
  "No respondió",
  "Timing inadecuado",
  "No era decisor",
  "Cambio de prioridades",
  "Otro",
];

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "kanban", label: "Kanban", icon: "▦" },
  { id: "list", label: "Listado", icon: "☰" },
  { id: "analytics", label: "Análisis", icon: "◴" },
];

/* ── helpers ── */
const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().slice(0, 10);


/* ── Colors ── */
const C = {
  bg: "#0f1117", surface: "#181b24", card: "#1e2230", border: "#2a2f3e",
  accent: "#5eead4", accentDim: "#2dd4bf30",
  danger: "#f87171", dangerDim: "#f8717120",
  warn: "#fbbf24", warnDim: "#fbbf2420",
  success: "#34d399", successDim: "#34d39920",
  text: "#e2e8f0", textDim: "#94a3b8", white: "#fff",
};
const stageColor = {
  "Primer Contacto": "#60a5fa", Cotizado: "#a78bfa", Negociación: "#fbbf24",
  Cierre: "#5eead4", Ganada: "#34d399", Perdida: "#f87171",
};

/* =================== LOGIN =================== */
function LoginScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    setErr("");
    if (!email.includes("@") || pass.length < 4) { setErr("Correo inválido o contraseña muy corta"); return; }
    setLoading(true);
    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { name: name || email.split("@")[0] } },
      });
      if (error) setErr(error.message);
      else setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setErr("Credenciales incorrectas");
    }
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 400, background: C.surface, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Revisa tu correo</h2>
          <p style={{ color: C.textDim, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Te enviamos un enlace de confirmación a <strong style={{ color: C.accent }}>{email}</strong>.<br />
            Haz click en el enlace para activar tu cuenta y luego inicia sesión.
          </p>
          <button onClick={() => { setEmailSent(false); setMode("login"); }}
            style={{ ...btnPrimary, width: "100%" }}>
            Ya confirmé, iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: C.surface, borderRadius: 16, padding: 40, border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} alt="Warica" style={{ height: 56, width: "auto" }} />
          <div style={{ color: C.textDim, marginTop: 8, fontSize: 14 }}>Sistema de gestión de oportunidades</div>
        </div>
        {mode === "register" && (
          <input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
        )}
        <input placeholder="correo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} type="email" />
        <input placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} type="password"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, width: "100%", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ color: C.textDim, fontSize: 13 }}>
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <span onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
              style={{ color: C.accent, cursor: "pointer" }}>{mode === "login" ? "Regístrate" : "Inicia sesión"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* =================== MAIN APP =================== */
function CRMApp({ user, onLogout }) {
  const [opps, setOpps] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ search: "", stage: "", service: "", orgType: "", companySize: "", salesperson: "" });
  const [config, setConfig] = useState({
    stages: DEFAULT_STAGES, serviceTypes: SERVICE_TYPES, orgTypes: ORG_TYPES,
    companySizes: COMPANY_SIZES, lostReasons: LOST_REASONS,
  });
  const isAdmin = user.role === "admin";

  useEffect(() => {
    supabase.from("crm_config").select("*").eq("id", "default").single().then(({ data }) => {
      if (data) setConfig({
        stages: data.stages || DEFAULT_STAGES,
        serviceTypes: data.service_types || SERVICE_TYPES,
        orgTypes: data.org_types || ORG_TYPES,
        companySizes: data.company_sizes || COMPANY_SIZES,
        lostReasons: data.lost_reasons || LOST_REASONS,
      });
    });
  }, []);

  useEffect(() => {
    supabase.from("opportunities").select("data").then(({ data }) => {
      if (data) setOpps(data.map((r) => r.data));
    });
    const channel = supabase.channel("opps-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, () => {
        supabase.from("opportunities").select("data").then(({ data }) => {
          if (data) setOpps(data.map((r) => r.data));
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const addOpp = async (data) => {
    const oppDate = data.createdAt || today();
    const o = { ...data, id: uid(), createdAt: oppDate, createdBy: user.userId, stage: "Primer Contacto", lostReason: "", history: [{ stage: "Primer Contacto", date: oppDate }] };
    await supabase.from("opportunities").insert({ id: o.id, data: o });
    setOpps((prev) => [...prev, o]);
    setModal(null);
  };
  const updateOpp = async (data) => {
    await supabase.from("opportunities").update({ data }).eq("id", data.id);
    setOpps((prev) => prev.map((o) => o.id === data.id ? { ...o, ...data } : o));
    setModal(null);
  };
  const moveStage = async (id, newStage, lostReason) => {
    const opp = opps.find((o) => o.id === id);
    const updated = { ...opp, stage: newStage, lostReason: lostReason || opp.lostReason, history: [...(opp.history || []), { stage: newStage, date: today() }] };
    await supabase.from("opportunities").update({ data: updated }).eq("id", id);
    setOpps((prev) => prev.map((o) => o.id === id ? updated : o));
  };
  const deleteOpp = async (id) => {
    await supabase.from("opportunities").delete().eq("id", id);
    setOpps((prev) => prev.filter((o) => o.id !== id));
  };

  const filtered = useMemo(() => {
    return opps.filter((o) => {
      if (filters.stage && o.stage !== filters.stage) return false;
      if (filters.service && o.serviceType !== filters.service) return false;
      if (filters.orgType && o.orgType !== filters.orgType) return false;
      if (filters.companySize && o.companySize !== filters.companySize) return false;
      if (filters.salesperson && o.salesperson !== filters.salesperson) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          o.company?.toLowerCase().includes(s) ||
          o.contact?.toLowerCase().includes(s) ||
          o.serviceType?.toLowerCase().includes(s) ||
          o.salesperson?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [opps, filters]);

  const tabs = [
    ...TABS,
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <ConfigCtx.Provider value={{ config, setConfig, isAdmin }}>
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO} alt="Warica" style={{ height: 28, width: "auto" }} />
          <nav style={{ display: "flex", gap: 2, marginLeft: 4 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ background: tab === t.id ? C.accentDim : "transparent", color: tab === t.id ? C.accent : C.textDim, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit", transition: "all .15s" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setModal({ type: "new" })} style={btnPrimary}>+ Oportunidad</button>
          <div onClick={() => setTab("profile")} style={{ color: tab === "profile" ? C.accent : C.textDim, fontSize: 12, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: tab === "profile" ? C.accentDim : "transparent" }}>{user.name}</div>
          <button onClick={onLogout} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Salir</button>
        </div>
      </header>
      {tab !== "admin" && <GlobalFilterBar filters={filters} setFilters={setFilters} opps={opps} />}

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard opps={filtered} />}
        {tab === "kanban" && <KanbanView opps={filtered} moveStage={moveStage} onEdit={(o) => setModal({ type: "edit", opp: o })} setModal={setModal} />}
        {tab === "list" && <ListView opps={filtered} onEdit={(o) => setModal({ type: "edit", opp: o })} onDelete={deleteOpp} moveStage={moveStage} setModal={setModal} />}
        {tab === "analytics" && <AnalyticsView opps={filtered} />}
        {tab === "profile" && <ProfileView user={user} />}
        {tab === "admin" && isAdmin && <AdminView currentUserId={user.userId} />}
      </main>

      {modal?.type === "new" && <OppModal onSave={addOpp} onClose={() => setModal(null)} defaultSalesperson={user.name} />}
      {modal?.type === "edit" && <OppModal opp={modal.opp} onSave={updateOpp} onClose={() => setModal(null)} onDelete={() => { deleteOpp(modal.opp.id); setModal(null); }} defaultSalesperson={user.name} />}
      {modal?.type === "lost" && <LostReasonModal opp={modal.opp} onSave={(reason) => { moveStage(modal.opp.id, LOST_STAGE, reason); setModal(null); }} onClose={() => setModal(null)} />}
    </div>
    </ConfigCtx.Provider>
  );
}

/* =================== DASHBOARD =================== */
function Dashboard({ opps }) {
  const { config } = useContext(ConfigCtx);
  const active = opps.filter((o) => config.stages.includes(o.stage));
  const won = opps.filter((o) => o.stage === WON_STAGE);
  const lost = opps.filter((o) => o.stage === LOST_STAGE);
  const closed = [...won, ...lost];
  const hitRate = pct(won.length, closed.length);
  const totalActive = active.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const totalWon = won.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const wonThisMonth = won.filter((o) => (o.history || []).some((e) => e.stage === WON_STAGE && e.date?.startsWith(thisMonth)));
  const wonThisMonthAmt = wonThisMonth.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const now = new Date();
  const avgAgeDays = active.length === 0 ? 0 : Math.round(
    active.reduce((sum, o) => {
      const d = o.createdAt ? new Date(o.createdAt) : now;
      return sum + (now - d) / 86400000;
    }, 0) / active.length
  );
  const ageLabel = avgAgeDays === 0 ? "Sin datos" : avgAgeDays === 1 ? "1 día" : `${avgAgeDays} días`;

  const cards = [
    { label: "Pipeline Activo", value: fmt(totalActive), sub: `${active.length} oportunidades`, color: C.accent },
    { label: "% de Bateo", value: `${hitRate}%`, sub: `${won.length} ganadas / ${closed.length} cerradas`, color: hitRate >= 50 ? C.success : hitRate >= 25 ? C.warn : C.danger },
    { label: "Antigüedad Promedio", value: ageLabel, sub: "días en pipeline activo", color: avgAgeDays > 60 ? C.danger : avgAgeDays > 30 ? C.warn : C.success },
    { label: "Cerradas este mes", value: fmt(wonThisMonthAmt), sub: `${wonThisMonth.length} oportunidades`, color: C.accent },
  ];

  return (
    <div>
      <h2 style={h2Style}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: 20, borderLeft: `3px solid ${c.color}` }}>
            <div style={{ color: C.textDim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "Space Mono", color: c.color }}>{c.value}</div>
            <div style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
        <div style={{ color: C.textDim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Desglose por etapa</div>
        {[...config.stages, WON_STAGE, LOST_STAGE].map((s) => {
          const so = opps.filter((o) => o.stage === s);
          const amt = so.reduce((a, o) => a + (Number(o.amount) || 0), 0);
          const allStages = [...config.stages, WON_STAGE, LOST_STAGE];
          const maxAmt = Math.max(...allStages.map((st) => opps.filter((o) => o.stage === st).reduce((a, o) => a + (Number(o.amount) || 0), 0)), 1);
          const color = getStageColor(s, config.stages);
          return (
            <div key={s} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: color, marginRight: 6 }} />{s}</span>
                <span style={{ color: C.textDim }}>{so.length} — {fmt(amt)}</span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: color, width: `${pct(amt, maxAmt)}%`, transition: "width .4s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =================== KANBAN =================== */
function KanbanView({ opps, moveStage, onEdit, setModal }) {
  const { config } = useContext(ConfigCtx);
  const allStages = [...config.stages, WON_STAGE, LOST_STAGE];
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDrop = (stage) => {
    if (!dragging) return;
    if (stage === LOST_STAGE) setModal({ type: "lost", opp: opps.find((o) => o.id === dragging) });
    else moveStage(dragging, stage);
    setDragging(null); setDragOver(null);
  };

  return (
    <div>
      <h2 style={{ ...h2Style, marginBottom: 16 }}>Kanban</h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${allStages.length},minmax(180px,1fr))`, gap: 10, overflowX: "auto", paddingBottom: 16 }}>
        {allStages.map((s) => {
          const so = opps.filter((o) => o.stage === s);
          const color = getStageColor(s, config.stages);
          return (
            <div key={s}
              onDragOver={(e) => { e.preventDefault(); setDragOver(s); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(s)}
              style={{ background: dragOver === s ? `${color}15` : C.surface, borderRadius: 12, padding: 10, minHeight: 300, border: `1px solid ${dragOver === s ? color : C.border}`, transition: "all .15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "4px 6px" }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: color, marginRight: 6 }} />{s}
                </span>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: "Space Mono" }}>{so.length}</span>
              </div>
              {so.map((o) => (
                <div key={o.id} draggable onDragStart={() => setDragging(o.id)} onClick={() => onEdit(o)}
                  style={{ background: C.card, borderRadius: 8, padding: 10, marginBottom: 6, cursor: "grab", fontSize: 12, borderLeft: `2px solid ${color}`, opacity: dragging === o.id ? 0.5 : 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{o.company}</div>
                  <div style={{ color: C.textDim }}>{o.contact}</div>
                  {o.salesperson && <div style={{ color: C.textDim, fontSize: 10, marginTop: 1 }}>👤 {o.salesperson}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ color, fontFamily: "Space Mono", fontWeight: 700 }}>{fmt(o.amount || 0)}</span>
                    <span style={{ color: C.textDim, fontSize: 10 }}>{o.serviceType}</span>
                  </div>
                  {o.stage === LOST_STAGE && o.lostReason && (
                    <div style={{ marginTop: 4, fontSize: 10, color: C.danger, background: C.dangerDim, borderRadius: 4, padding: "2px 6px" }}>{o.lostReason}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =================== LIST =================== */
function ListView({ opps, onEdit, onDelete, moveStage, setModal }) {
  const [sort, setSort] = useState({ col: null, dir: "desc" });

  const toggleSort = (col) => {
    setSort((s) => s.col === col ? { col, dir: s.dir === "desc" ? "asc" : "desc" } : { col, dir: "desc" });
  };

  const displayed = useMemo(() => {
    let rows = [...opps];
    if (sort.col === "amount") {
      rows.sort((a, b) => sort.dir === "desc" ? (Number(b.amount) || 0) - (Number(a.amount) || 0) : (Number(a.amount) || 0) - (Number(b.amount) || 0));
    } else if (sort.col === "date") {
      rows.sort((a, b) => sort.dir === "desc" ? (b.createdAt || "").localeCompare(a.createdAt || "") : (a.createdAt || "").localeCompare(b.createdAt || ""));
    }
    return rows;
  }, [opps, sort]);

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <span style={{ color: C.border, marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: C.accent, marginLeft: 4 }}>{sort.dir === "desc" ? "↓" : "↑"}</span>;
  };

  const thBase = { padding: "10px 12px", color: C.textDim, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}` };
  const thSort = { ...thBase, cursor: "pointer", userSelect: "none" };

  return (
    <div>
      <h2 style={h2Style}>Listado de Oportunidades</h2>
      <div style={{ background: C.card, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, textAlign: "left" }}>
                <th style={thBase}>Empresa</th>
                <th style={thBase}>Contacto</th>
                <th style={thBase}>Vendedor</th>
                <th style={thBase}>Tipo</th>
                <th style={thBase}>Tamaño</th>
                <th style={thBase}>Servicio</th>
                <th style={thSort} onClick={() => toggleSort("amount")}>Monto<SortIcon col="amount" /></th>
                <th style={thBase}>Etapa</th>
                <th style={thSort} onClick={() => toggleSort("date")}>Fecha<SortIcon col="date" /></th>
                <th style={thBase}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: C.textDim }}>No hay oportunidades</td></tr>
              )}
              {displayed.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}><span style={{ fontWeight: 600 }}>{o.company}</span></td>
                  <td style={tdStyle}>{o.contact}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{o.salesperson}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{o.orgType}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{o.companySize}</td>
                  <td style={tdStyle}>{o.serviceType}</td>
                  <td style={{ ...tdStyle, fontFamily: "Space Mono", fontWeight: 700, color: stageColor[o.stage] }}>{fmt(o.amount || 0)}</td>
                  <td style={tdStyle}>
                    <select value={o.stage} onChange={(e) => {
                      const ns = e.target.value;
                      if (ns === LOST_STAGE) setModal({ type: "lost", opp: o });
                      else moveStage(o.id, ns);
                    }} style={{ ...selectSmall, color: stageColor[o.stage] }}>
                      {ALL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{o.createdAt}</td>
                  <td style={tdStyle}>
                    <button onClick={() => onEdit(o)} style={btnSmall}>Editar</button>
                    <button onClick={() => onDelete(o.id)} style={{ ...btnSmall, color: C.danger, marginLeft: 4 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =================== ANALYTICS =================== */
function AnalyticsView({ opps }) {
  const lost = opps.filter((o) => o.stage === LOST_STAGE);
  const reasonCount = {};
  lost.forEach((o) => { const r = o.lostReason || "Sin especificar"; reasonCount[r] = (reasonCount[r] || 0) + 1; });
  const sorted = Object.entries(reasonCount).sort((a, b) => b[1] - a[1]);
  const total = lost.length;
  const pieColors = ["#f87171", "#fbbf24", "#60a5fa", "#a78bfa", "#34d399", "#5eead4", "#fb923c", "#e879f9"];

  let cumAngle = 0;
  const slices = sorted.map(([reason, count], i) => {
    const angle = (count / (total || 1)) * 360;
    const sl = { reason, count, pct: pct(count, total || 1), startAngle: cumAngle, angle, color: pieColors[i % pieColors.length] };
    cumAngle += angle;
    return sl;
  });

  const polarToCart = (cx, cy, r, deg) => { const rad = ((deg - 90) * Math.PI) / 180; return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }; };
  const describeArc = (cx, cy, r, start, end) => {
    const s = polarToCart(cx, cy, r, start);
    const e = polarToCart(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  };

  return (
    <div>
      <h2 style={h2Style}>Análisis</h2>
      <div style={{ background: C.card, borderRadius: 12, padding: 24 }}>
        <div style={{ color: C.textDim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Razones de Pérdida</div>
        {slices.length === 0 ? (
          <div style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: 40 }}>No hay oportunidades perdidas aún</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
            <svg viewBox="0 0 200 200" width={220} height={220}>
              {slices.map((sl, i) => (
                <path key={i} d={sl.angle >= 360 ? describeArc(100, 100, 90, 0, 359.99) : describeArc(100, 100, 90, sl.startAngle, sl.startAngle + sl.angle)}
                  fill={sl.color} stroke={C.card} strokeWidth={2} style={{ cursor: "pointer" }}>
                  <title>{sl.reason}: {sl.pct}%</title>
                </path>
              ))}
              <circle cx={100} cy={100} r={45} fill={C.card} />
              <text x={100} y={95} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={700} fontFamily="Space Mono">{total}</text>
              <text x={100} y={112} textAnchor="middle" fill={C.textDim} fontSize={10}>perdidas</text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {slices.map((sl, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: sl.color, flexShrink: 0 }} />
                  <span style={{ minWidth: 160 }}>{sl.reason}</span>
                  <span style={{ fontFamily: "Space Mono", fontWeight: 700, color: sl.color }}>{sl.pct}%</span>
                  <span style={{ color: C.textDim, fontSize: 11 }}>({sl.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =================== GLOBAL FILTER BAR =================== */
function GlobalFilterBar({ filters, setFilters, opps }) {
  const { config } = useContext(ConfigCtx);
  const allStages = [...config.stages, WON_STAGE, LOST_STAGE];
  const salespeople = useMemo(() => [...new Set(opps.map((o) => o.salesperson).filter(Boolean))].sort(), [opps]);
  const hasFilters = Object.values(filters).some(Boolean);
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  const clear = () => setFilters({ search: "", stage: "", service: "", orgType: "", companySize: "", salesperson: "" });

  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "8px 24px", position: "sticky", top: 56, zIndex: 40, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <input placeholder="Buscar empresa, contacto, vendedor..." value={filters.search} onChange={(e) => set("search", e.target.value)} style={{ ...inputSmall, width: 220 }} />
      <select value={filters.stage} onChange={(e) => set("stage", e.target.value)} style={selectSmall}>
        <option value="">Etapa</option>
        {allStages.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.service} onChange={(e) => set("service", e.target.value)} style={selectSmall}>
        <option value="">Servicio</option>
        {config.serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.orgType} onChange={(e) => set("orgType", e.target.value)} style={selectSmall}>
        <option value="">Tipo org.</option>
        {config.orgTypes.map((t) => <option key={t}>{t}</option>)}
      </select>
      <select value={filters.companySize} onChange={(e) => set("companySize", e.target.value)} style={selectSmall}>
        <option value="">Tamaño</option>
        {config.companySizes.map((t) => <option key={t}>{t}</option>)}
      </select>
      {salespeople.length > 0 && (
        <select value={filters.salesperson} onChange={(e) => set("salesperson", e.target.value)} style={selectSmall}>
          <option value="">Vendedor</option>
          {salespeople.map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      {hasFilters && <button onClick={clear} style={{ ...btnSmall, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11 }}>× Limpiar</button>}
    </div>
  );
}

/* =================== MODALS =================== */
function OppModal({ opp, onSave, onClose, onDelete, defaultSalesperson }) {
  const { config } = useContext(ConfigCtx);
  const allStages = [...config.stages, WON_STAGE, LOST_STAGE];
  const [form, setForm] = useState(opp || { company: "", contact: "", salesperson: defaultSalesperson || "", orgType: config.orgTypes[0], companySize: config.companySizes[0], serviceType: config.serviceTypes[0], amount: "", notes: "", stage: config.stages[0] || "Primer Contacto", createdAt: today() });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const isEdit = !!opp;
  const isMobile = useIsMobile();

  // Stages to show in history: from "Primer Contacto" up to current stage (in pipeline order)
  const pipelineOrder = [...STAGES, WON_STAGE, LOST_STAGE];
  const currentIdx = pipelineOrder.indexOf(form.stage);
  const stagesInHistory = currentIdx >= 0 ? pipelineOrder.slice(0, currentIdx + 1) : [form.stage];

  const getHistoryDate = (stage) => {
    if (stage === "Primer Contacto") return form.createdAt || "";
    return (form.history || []).find((e) => e.stage === stage)?.date || "";
  };

  const setHistoryDate = (stage, date) => {
    if (stage === "Primer Contacto") { set("createdAt", date); return; }
    const h = [...(form.history || [])];
    const idx = h.findIndex((e) => e.stage === stage);
    if (idx >= 0) h[idx] = { ...h[idx], date };
    else h.push({ stage, date });
    set("history", h);
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: isMobile ? "100%" : 520 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600 }}>{isEdit ? "Editar Oportunidad" : "Nueva Oportunidad"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          <Field label="Empresa"><input value={form.company} onChange={(e) => set("company", e.target.value)} style={inputStyle} placeholder="Nombre de empresa" /></Field>
          <Field label="Contacto"><input value={form.contact} onChange={(e) => set("contact", e.target.value)} style={inputStyle} placeholder="Nombre del contacto" /></Field>
          <Field label="Vendedor"><input value={form.salesperson || ""} onChange={(e) => set("salesperson", e.target.value)} style={inputStyle} placeholder="Nombre del vendedor" /></Field>
          <Field label="Fecha de creación">
            <input type="date" value={form.createdAt || today()} max={today()} onChange={(e) => set("createdAt", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Tipo de Org.">
            <select value={form.orgType} onChange={(e) => set("orgType", e.target.value)} style={inputStyle}>{config.orgTypes.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Tamaño">
            <select value={form.companySize} onChange={(e) => set("companySize", e.target.value)} style={inputStyle}>{config.companySizes.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Servicio">
            <select value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)} style={inputStyle}>{config.serviceTypes.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Monto (MXN)"><input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} style={inputStyle} placeholder="0" /></Field>
          {isEdit && (
            <Field label="Etapa">
              <select value={form.stage} onChange={(e) => set("stage", e.target.value)} style={inputStyle}>{allStages.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
          )}
        </div>
        <Field label="Notas"><textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} style={{ ...inputStyle, height: 60, resize: "vertical" }} /></Field>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Historial de etapas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stagesInHistory.map((stage) => {
              const date = getHistoryDate(stage);
              return (
                <div key={stage} style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 8, padding: "6px 10px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: stageColor[stage] || C.textDim, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1, color: C.text }}>{stage}</span>
                  <input type="date" value={date} max={today()} onChange={(e) => setHistoryDate(stage, e.target.value)}
                    style={{ ...inputSmall, width: 140, padding: "3px 8px", color: date ? C.text : C.textDim }} />
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <div>{isEdit && onDelete && <button onClick={onDelete} style={{ ...btnSmall, color: C.danger }}>Eliminar</button>}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button onClick={() => { if (!form.company) return; onSave(form); }} style={btnPrimary}>{isEdit ? "Guardar" : "Crear"}</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function LostReasonModal({ opp, onSave, onClose }) {
  const { config } = useContext(ConfigCtx);
  const [reason, setReason] = useState(config.lostReasons[0]);
  const [custom, setCustom] = useState("");
  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 400 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: C.danger }}>Oportunidad Perdida</h3>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16 }}>¿Cuál fue la razón principal por la que se perdió <b>{opp?.company}</b>?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {config.lostReasons.map((r) => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, padding: "6px 10px", borderRadius: 8, background: reason === r ? C.dangerDim : "transparent", border: `1px solid ${reason === r ? C.danger : C.border}`, transition: "all .15s" }}>
              <input type="radio" name="lr" checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: C.danger }} />{r}
            </label>
          ))}
        </div>
        {reason === "Otro" && <input placeholder="Especifica la razón" value={custom} onChange={(e) => setCustom(e.target.value)} style={inputStyle} />}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSave(reason === "Otro" ? custom || "Otro" : reason)} style={{ ...btnPrimary, background: C.danger }}>Marcar como Perdida</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ── shared UI ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

function Overlay({ children, onClose }) {
  const isMobile = useIsMobile();
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: isMobile ? 0 : 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? "20px 16px 32px" : 24, border: `1px solid ${C.border}`, width: isMobile ? "100%" : "auto", maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto" }}>{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>{children}</div>;
}

/* =================== PROFILE VIEW =================== */
function ProfileView({ user }) {
  const [name, setName] = useState(user.name || "");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [nameMsg, setNameMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.userId);
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setNameMsg({ ok: true, text: "Nombre actualizado" });
    setSaving(false);
    setTimeout(() => setNameMsg(null), 3000);
  };

  const savePassword = async () => {
    if (newPass.length < 6) { setPassMsg({ ok: false, text: "Mínimo 6 caracteres" }); return; }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: "Las contraseñas no coinciden" }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setPassMsg({ ok: false, text: error.message });
    else { setPassMsg({ ok: true, text: "Contraseña actualizada" }); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }
    setSaving(false);
    setTimeout(() => setPassMsg(null), 3000);
  };

  const card = { background: C.card, borderRadius: 12, padding: 24, marginBottom: 16 };

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={h2Style}>Mi Perfil</h2>

      <div style={card}>
        <div style={{ fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Información personal</div>
        <Field label="Correo electrónico">
          <input value={user.email} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
        </Field>
        <Field label="Nombre">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Tu nombre" />
        </Field>
        {nameMsg && <div style={{ fontSize: 13, color: nameMsg.ok ? C.success : C.danger, marginBottom: 8 }}>{nameMsg.text}</div>}
        <button onClick={saveName} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>Guardar nombre</button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Cambiar contraseña</div>
        <Field label="Nueva contraseña">
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={inputStyle} placeholder="Mínimo 6 caracteres" />
        </Field>
        <Field label="Confirmar contraseña">
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} style={inputStyle} placeholder="Repite la contraseña"
            onKeyDown={(e) => e.key === "Enter" && savePassword()} />
        </Field>
        {passMsg && <div style={{ fontSize: 13, color: passMsg.ok ? C.success : C.danger, marginBottom: 8 }}>{passMsg.text}</div>}
        <button onClick={savePassword} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>Actualizar contraseña</button>
      </div>
    </div>
  );
}

/* ── styles ── */
const inputStyle = { width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const inputSmall = { ...inputStyle, padding: "5px 10px", fontSize: 12 };
const selectSmall = { ...inputSmall, cursor: "pointer" };
const btnPrimary = { background: C.accent, color: C.bg, border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const btnSecondary = { background: "transparent", color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" };
const btnSmall = { background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: "2px 6px" };
const tdStyle = { padding: "10px 12px", verticalAlign: "middle" };
const h2Style = { margin: "0 0 16px", fontSize: 20, fontWeight: 600 };

/* =================== ADMIN VIEW =================== */
function AdminView({ currentUserId }) {
  const { config, setConfig } = useContext(ConfigCtx);
  const [section, setSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => { setLocalConfig(config); }, [config]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at").then(({ data }) => setUsers(data || []));
  }, []);

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, role: newRole } : p));
  };

  const toggleActive = async (u) => {
    if (u.id === currentUserId) return;
    const newActive = !u.active;
    await supabase.from("profiles").update({ active: newActive }).eq("id", u.id);
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, active: newActive } : p));
  };

  const saveConfig = async () => {
    setSaving(true);
    await supabase.from("crm_config").update({
      stages: localConfig.stages,
      service_types: localConfig.serviceTypes,
      org_types: localConfig.orgTypes,
      company_sizes: localConfig.companySizes,
      lost_reasons: localConfig.lostReasons,
    }).eq("id", "default");
    setConfig(localConfig);
    setSaving(false);
  };

  const EditableList = ({ label, field }) => {
    const items = localConfig[field] || [];
    const [newItem, setNewItem] = useState("");
    const update = (newList) => setLocalConfig({ ...localConfig, [field]: newList });
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input value={item} onChange={(e) => { const l = [...items]; l[i] = e.target.value; update(l); }}
                style={{ ...inputSmall, flex: 1 }} />
              <button onClick={() => update(items.filter((_, j) => j !== i))}
                style={{ ...btnSmall, color: C.danger, fontSize: 16 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newItem.trim()) { update([...items, newItem.trim()]); setNewItem(""); } }}
              placeholder="Agregar..." style={{ ...inputSmall, flex: 1 }} />
            <button onClick={() => { if (newItem.trim()) { update([...items, newItem.trim()]); setNewItem(""); } }}
              style={{ ...btnPrimary, padding: "5px 14px", fontSize: 12 }}>+</button>
          </div>
        </div>
      </div>
    );
  };

  const [resetMsg, setResetMsg] = useState({});
  const sendReset = async (u) => {
    if (!u.email) { setResetMsg({ [u.id]: { ok: false, text: "Sin email" } }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, { redirectTo: window.location.origin });
    setResetMsg({ [u.id]: error ? { ok: false, text: "Error" } : { ok: true, text: "Enviado" } });
    setTimeout(() => setResetMsg({}), 3000);
  };

  const sectionBtn = (id, label) => (
    <button onClick={() => setSection(id)} style={{ background: section === id ? C.accentDim : "transparent", color: section === id ? C.accent : C.textDim, border: "none", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>{label}</button>
  );

  return (
    <div>
      <h2 style={h2Style}>Administración</h2>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, width: "fit-content", border: `1px solid ${C.border}` }}>
        {sectionBtn("users", "👥 Usuarios")}
        {sectionBtn("passwords", "🔑 Contraseñas")}
        {sectionBtn("config", "⚙ Configuración")}
      </div>

      {section === "users" && (
        <div>
          <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.surface, textAlign: "left" }}>
                  {["Nombre", "Rol", "Estado", "Acciones"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", color: C.textDim, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: u.active === false ? 0.5 : 1 }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                      {u.id === currentUserId && <div style={{ fontSize: 10, color: C.accent }}>Tú</div>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: u.role === "admin" ? C.accentDim : C.border + "40", color: u.role === "admin" ? C.accent : C.textDim, borderRadius: 6, padding: "2px 10px", fontSize: 12 }}>{u.role}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: u.active !== false ? C.success : C.danger, fontSize: 12 }}>{u.active !== false ? "Activo" : "Inactivo"}</span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => toggleRole(u)} disabled={u.id === currentUserId}
                        style={{ ...btnSmall, opacity: u.id === currentUserId ? 0.3 : 1 }}>
                        {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                      </button>
                      <button onClick={() => toggleActive(u)} disabled={u.id === currentUserId}
                        style={{ ...btnSmall, color: u.active !== false ? C.danger : C.success, marginLeft: 4, opacity: u.id === currentUserId ? 0.3 : 1 }}>
                        {u.active !== false ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>🔗 Link de registro para nuevos usuarios</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={window.location.origin} style={{ ...inputSmall, flex: 1, color: C.textDim }} />
              <button onClick={() => navigator.clipboard.writeText(window.location.origin)}
                style={{ ...btnPrimary, padding: "5px 14px", fontSize: 12 }}>Copiar</button>
            </div>
          </div>
        </div>
      )}

      {section === "passwords" && (
        <div style={{ background: C.card, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textDim }}>
            Envía un correo de restablecimiento de contraseña a cualquier usuario. El usuario recibirá un link para crear una nueva contraseña.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, textAlign: "left" }}>
                {["Nombre", "Correo", "Rol", "Acción"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", color: C.textDim, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>{u.name || "—"} {u.id === currentUserId && <span style={{ fontSize: 10, color: C.accent }}>(tú)</span>}</td>
                  <td style={{ ...tdStyle, color: C.textDim }}>{u.email || "—"}</td>
                  <td style={tdStyle}><span style={{ background: u.role === "admin" ? C.accentDim : C.border + "40", color: u.role === "admin" ? C.accent : C.textDim, borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>{u.role}</span></td>
                  <td style={tdStyle}>
                    <button onClick={() => sendReset(u)} style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>
                      Enviar reset
                    </button>
                    {resetMsg[u.id] && <span style={{ marginLeft: 8, fontSize: 12, color: resetMsg[u.id].ok ? C.success : C.danger }}>{resetMsg[u.id].text}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === "config" && (
        <div style={{ background: C.card, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
            <EditableList label="Etapas del pipeline" field="stages" />
            <EditableList label="Tipos de servicio" field="serviceTypes" />
            <EditableList label="Tipos de organización" field="orgTypes" />
            <EditableList label="Tamaños de empresa" field="companySizes" />
            <EditableList label="Razones de pérdida" field="lostReasons" />
          </div>
          <button onClick={saveConfig} disabled={saving} style={{ ...btnPrimary, marginTop: 8, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =================== PASSWORD RECOVERY =================== */
function PasswordRecoveryScreen() {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(false);

  const save = async () => {
    if (newPass.length < 6) { setMsg({ ok: false, text: "Mínimo 6 caracteres" }); return; }
    if (newPass !== confirmPass) { setMsg({ ok: false, text: "Las contraseñas no coinciden" }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setMsg({ ok: false, text: error.message });
    else { setMsg({ ok: true, text: "Contraseña actualizada correctamente" }); setDone(true); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: C.surface, borderRadius: 16, padding: 40, border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={LOGO} alt="Warica" style={{ height: 48, width: "auto" }} />
          <div style={{ color: C.text, fontWeight: 600, fontSize: 18, marginTop: 16 }}>Nueva contraseña</div>
        </div>
        {done ? (
          <>
            <div style={{ color: C.success, fontSize: 14, textAlign: "center", marginBottom: 20 }}>✓ {msg.text}</div>
            <button onClick={() => supabase.auth.signOut()} style={{ ...btnPrimary, width: "100%" }}>Ir al login</button>
          </>
        ) : (
          <>
            <Field label="Nueva contraseña">
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} placeholder="Mínimo 6 caracteres" />
            </Field>
            <Field label="Confirmar contraseña">
              <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} placeholder="Repite la contraseña"
                onKeyDown={(e) => e.key === "Enter" && save()} />
            </Field>
            {msg && <div style={{ color: msg.ok ? C.success : C.danger, fontSize: 13, marginBottom: 12 }}>{msg.text}</div>}
            <button onClick={save} style={{ ...btnPrimary, width: "100%" }}>Guardar contraseña</button>
          </>
        )}
      </div>
    </div>
  );
}

/* =================== ROOT =================== */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      else { setRecovering(false); setSession(session); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  if (recovering) return <PasswordRecoveryScreen />;
  if (session === undefined) return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  if (!session) return <LoginScreen />;
  if (session && !profile) return <div style={{ background: C.bg, minHeight: "100vh" }} />;

  if (profile?.active === false) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, borderRadius: 16, padding: 40, textAlign: "center", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
        <div style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Cuenta desactivada</div>
        <div style={{ color: C.textDim, fontSize: 13, marginBottom: 20 }}>Contacta al administrador para recuperar el acceso.</div>
        <button onClick={() => supabase.auth.signOut()} style={btnSecondary}>Cerrar sesión</button>
      </div>
    </div>
  );

  const user = {
    userId: session.user.id,
    email: session.user.email,
    name: profile?.name || session.user.user_metadata?.name || session.user.email.split("@")[0],
    role: profile?.role || "user",
  };

  return <CRMApp user={user} onLogout={() => supabase.auth.signOut()} />;
}
