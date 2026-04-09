import { useState, useEffect, useMemo, useContext, createContext } from "react";
import { supabase } from "./supabase";

const LOGO = "/logo.jpeg";
const APP_NAME = "Abuelo CRM";

/* ── Stages (all units share these) ── */
const DEFAULT_STAGES = ["Backlog", "Cotizado", "Confirmado", "Completado", "Cancelado"];
const COMPLETED_STAGE = "Completado";
const CANCELLED_STAGE = "Cancelado";
const CONFIRMED_STAGE = "Confirmado";
// aliases for legacy code paths
const WON_STAGE = COMPLETED_STAGE;
const LOST_STAGE = CANCELLED_STAGE;

const getStageColor = (stage) => {
  const MAP = {
    Backlog:    "#a8a295",  // warm gray
    Cotizado:   "#7a8aa3",  // muted slate blue
    Confirmado: "#c15f3c",  // Claude terracotta (primary/active)
    Completado: "#5e7a45",  // muted sage
    Cancelado:  "#b34a3a",  // muted warm red
  };
  return MAP[stage] || "#a8a295";
};

const PRIORITIES = ["Alta", "Media", "Baja"];
const PRIORITY_COLOR = { Alta: "#b34a3a", Media: "#b5882a", Baja: "#7a9b6e" };

const LOST_REASONS = [
  "Precio muy alto", "Eligió competencia", "Sin presupuesto", "No respondió",
  "Timing inadecuado", "No era decisor", "Cambio de prioridades", "Otro",
];

const BUSINESS_UNITS = [
  { id: "eventos",    label: "Eventos Warica",       icon: "🎪" },
  { id: "proyectos",  label: "Proyectos del Abuelo", icon: "🏗" },
  { id: "excursiones",label: "Excursiones",           icon: "🏕" },
];

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "kanban",    label: "Kanban",    icon: "▦" },
  { id: "list",      label: "Listado",   icon: "☰" },
  { id: "analytics", label: "Análisis",  icon: "◴" },
];

/* ── Config Context ── */
const ConfigCtx = createContext(null);

/* ── Helpers ── */
const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toISOString().slice(0, 10);

const OPP_STATUSES = [
  { value: "a_tiempo", label: "A tiempo", color: "#5e7a45", icon: "✓" },
  { value: "atrasada", label: "Atrasada", color: "#b34a3a", icon: "⚠" },
  { value: "en_pausa", label: "En pausa", color: "#b5882a", icon: "⏸" },
];
const getOppStatus = (opp) => {
  return OPP_STATUSES.find((s) => s.value === opp.status) || OPP_STATUSES[0];
};

/* ── Google Calendar Apps Script Web App ── */
// URL del Web App desplegado desde Apps Script (ver google-calendar-webhook.js)
// Debe configurarse en .env como VITE_GCAL_WEBHOOK_URL o editar aquí directamente
const GCAL_WEBHOOK_URL = import.meta.env.VITE_GCAL_WEBHOOK_URL || "";

const ORG_TYPES = ["Empresa", "Colegio", "Gobierno", "ONG", "Asociación", "Otro"];
const SIZE_RANGES = ["1-10", "11-50", "51-100", "101-200", "200+"];
const inSizeRange = (val, range) => {
  if (!range || !val) return true;
  const n = Number(val);
  if (isNaN(n)) return false;
  if (range === "200+") return n > 200;
  const [lo, hi] = range.split("-").map(Number);
  return n >= lo && n <= hi;
};

const emptyOpp = (unit, salesperson, stages) => ({
  company: "", contact: "", salesperson: salesperson || "",
  projectName: "", eventDateTime: "", attendees: "",
  orgType: "", startTime: "", endTime: "",
  amount: "", priority: "Media", status: "a_tiempo", notes: "",
  stage: (stages || DEFAULT_STAGES)[0],
  businessUnit: unit, createdAt: today(),
  activities: [], history: [],
});

/* ── Colors (Claude light palette) ── */
const C = {
  bg: "#faf9f5",             // warm cream background
  surface: "#f5f1e8",        // beige for headers / sticky bars
  card: "#ffffff",           // white cards
  cardAlt: "#fbf9f3",        // subtle off-white for alt rows
  border: "#ebe4d3",         // warm beige border
  borderStrong: "#d9cfb8",   // slightly darker divider
  accent: "#c15f3c",         // Claude terracotta orange
  accentHover: "#a94e2e",    // darker on hover
  accentDim: "#c15f3c14",    // ~8% alpha wash
  danger: "#b34a3a",         // muted warm red
  dangerDim: "#b34a3a14",
  warn: "#b5882a",           // muted amber
  warnDim: "#b5882a14",
  success: "#5e7a45",        // muted sage
  successDim: "#5e7a4514",
  text: "#1a1713",           // warm near-black
  textStrong: "#0c0a08",
  textDim: "#7a7466",        // warm muted gray
  textMuted: "#a39c8a",      // even more muted
  white: "#fff",
  shadow: "0 1px 2px rgba(20,15,8,0.04), 0 2px 8px rgba(20,15,8,0.03)",
  shadowStrong: "0 2px 4px rgba(20,15,8,0.05), 0 8px 24px rgba(20,15,8,0.06)",
};

/* ── Styles (defined early so LoginScreen can use them) ── */
const inputStyle = {
  width: "100%", background: C.white, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: "9px 13px", color: C.text, fontSize: 13,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
};
const inputSmall = { ...inputStyle, padding: "6px 11px", fontSize: 12, borderRadius: 8 };
const selectSmall = { ...inputSmall, cursor: "pointer" };
const btnPrimary = {
  background: C.accent, color: C.white, border: "none", borderRadius: 10,
  padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "inherit", letterSpacing: "-0.005em",
  transition: "background-color 120ms ease, transform 80ms ease",
};
const btnSecondary = {
  background: C.white, color: C.text, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.005em",
  transition: "border-color 120ms ease, background-color 120ms ease",
};
const btnSmall = {
  background: "none", border: "none", color: C.accent,
  cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit", padding: "2px 6px",
};
const tdStyle = { padding: "11px 14px", verticalAlign: "middle" };
const h2Style = {
  margin: "0 0 18px", fontSize: 20, fontWeight: 600,
  letterSpacing: "-0.018em", color: C.textStrong,
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

  if (emailSent) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Revisa tu correo</h2>
        <p style={{ color: C.textDim, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Te enviamos un enlace de confirmación a <strong style={{ color: C.accent }}>{email}</strong>.<br />
          Haz click en el enlace para activar tu cuenta y luego inicia sesión.
        </p>
        <button onClick={() => { setEmailSent(false); setMode("login"); }} style={{ ...btnPrimary, width: "100%" }}>
          Ya confirmé, iniciar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} alt={APP_NAME} style={{ height: 56, width: "auto" }} />
          <div style={{ color: C.textDim, marginTop: 8, fontSize: 14 }}>Sistema de gestión de oportunidades</div>
        </div>
        {mode === "register" && (
          <input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }} />
        )}
        <input placeholder="correo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, marginBottom: 8 }} type="email" />
        <input placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)}
          style={{ ...inputStyle, marginBottom: 8 }} type="password"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ ...btnPrimary, width: "100%", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ color: C.textDim, fontSize: 13 }}>
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <span onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
              style={{ color: C.accent, cursor: "pointer" }}>
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* =================== MAIN APP =================== */
function CRMApp({ user, onLogout }) {
  const [allOpps, setAllOpps] = useState([]);
  const [businessUnit, setBusinessUnit] = useState("eventos");
  const [mainView, setMainView] = useState("unit"); // "unit" | "profile" | "admin"
  const [config, setConfig] = useState({ stages: DEFAULT_STAGES, lostReasons: LOST_REASONS });
  const isAdmin = user.role === "admin";

  useEffect(() => {
    supabase.from("crm_config").select("*").eq("id", "default").single().then(({ data }) => {
      if (data) setConfig({
        stages: data.stages || DEFAULT_STAGES,
        lostReasons: data.lost_reasons || LOST_REASONS,
      });
    });
  }, []);

  useEffect(() => {
    supabase.from("opportunities").select("data").then(({ data }) => {
      if (data) setAllOpps(data.map((r) => r.data));
    });
    const ch = supabase.channel("opps-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, () => {
        supabase.from("opportunities").select("data").then(({ data }) => {
          if (data) setAllOpps(data.map((r) => r.data));
        });
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const unitOpps = useMemo(
    () => allOpps.filter((o) => (o.businessUnit || "eventos") === businessUnit),
    [allOpps, businessUnit]
  );

  const addOpp = async (data) => {
    const o = {
      ...data, id: uid(), businessUnit,
      createdAt: data.createdAt || today(),
      stage: data.stage || config.stages[0],
      activities: data.activities || [],
      history: [{ stage: data.stage || config.stages[0], date: data.createdAt || today() }],
    };
    await supabase.from("opportunities").insert({ id: o.id, data: o });
    setAllOpps((prev) => [...prev, o]);
  };

  const updateOpp = async (data) => {
    await supabase.from("opportunities").update({ data }).eq("id", data.id);
    setAllOpps((prev) => prev.map((o) => (o.id === data.id ? { ...o, ...data } : o)));
  };

  const moveStage = async (id, newStage, reason) => {
    const opp = allOpps.find((o) => o.id === id);
    const updated = {
      ...opp, stage: newStage,
      lostReason: reason || opp.lostReason,
      history: [...(opp.history || []), { stage: newStage, date: today() }],
    };
    await supabase.from("opportunities").update({ data: updated }).eq("id", id);
    setAllOpps((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  const deleteOpp = async (id) => {
    await supabase.from("opportunities").delete().eq("id", id);
    setAllOpps((prev) => prev.filter((o) => o.id !== id));
  };

  const goUnit = (unitId) => { setBusinessUnit(unitId); setMainView("unit"); };

  return (
    <ConfigCtx.Provider value={{ config, setConfig, isAdmin }}>
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }}>
        {/* ── Header ── */}
        <header style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "0 16px", height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={LOGO} alt={APP_NAME} style={{ height: 28, width: "auto", cursor: "pointer" }}
              onClick={() => setMainView("unit")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div onClick={() => setMainView("profile")}
              style={{ color: mainView === "profile" ? C.accent : C.textDim, fontSize: 12, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: mainView === "profile" ? C.accentDim : "transparent" }}>
              {user.name}
            </div>
            {isAdmin && (
              <div onClick={() => setMainView("admin")}
                style={{ color: mainView === "admin" ? C.accent : C.textDim, fontSize: 12, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: mainView === "admin" ? C.accentDim : "transparent" }}>
                ⚙ Admin
              </div>
            )}
            <button onClick={onLogout}
              style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Salir
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* ── Left Sidebar ── */}
          <Sidebar businessUnit={businessUnit} onSelect={goUnit} mainView={mainView} />

          {/* ── Main Content ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {mainView === "profile" && (
              <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
                <ProfileView user={user} />
              </div>
            )}
            {mainView === "admin" && isAdmin && (
              <div style={{ padding: 24 }}>
                <AdminView currentUserId={user.userId} />
              </div>
            )}
            {mainView === "unit" && (
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
          </div>
        </div>
      </div>
    </ConfigCtx.Provider>
  );
}

/* =================== SIDEBAR =================== */
function Sidebar({ businessUnit, onSelect, mainView }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", overflowX: "auto", padding: "8px 12px", gap: 6,
        position: "sticky", top: 56, zIndex: 40,
      }}>
        {BUSINESS_UNITS.map((u) => {
          const active = mainView === "unit" && businessUnit === u.id;
          return (
            <button key={u.id} onClick={() => onSelect(u.id)}
              style={{
                background: active ? C.accentDim : "transparent",
                color: active ? C.accent : C.textDim,
                border: `1px solid ${active ? C.accent : C.border}`,
                borderRadius: 20, padding: "5px 14px", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
              {u.icon} {u.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      width: 200, background: C.surface, borderRight: `1px solid ${C.border}`,
      padding: "16px 8px", display: "flex", flexDirection: "column", gap: 2,
      position: "sticky", top: 56, alignSelf: "flex-start", height: "calc(100vh - 56px)", overflowY: "auto",
    }}>
      <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, padding: "4px 12px", marginBottom: 4 }}>
        Unidades de negocio
      </div>
      {BUSINESS_UNITS.map((u) => {
        const active = mainView === "unit" && businessUnit === u.id;
        return (
          <button key={u.id} onClick={() => onSelect(u.id)}
            style={{
              background: active ? C.accentDim : "transparent",
              color: active ? C.accent : C.textDim,
              border: "none", borderRadius: 8, padding: "10px 12px",
              cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
              fontFamily: "inherit", textAlign: "left", transition: "all .15s",
              display: "flex", alignItems: "center", gap: 8,
            }}>
            <span style={{ fontSize: 16 }}>{u.icon}</span>
            <span style={{ lineHeight: 1.3 }}>{u.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =================== UNIT CRM =================== */
function UnitCRM({ businessUnit, opps, addOpp, updateOpp, deleteOpp, moveStage, user }) {
  const { config } = useContext(ConfigCtx);
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [calendarPrompt, setCalendarPrompt] = useState(null);
  const [filters, setFilters] = useState({ search: "", stage: "", salesperson: "", priority: "", orgType: "", sizeRange: "" });

  // Validate that an eventos opp has all required fields before moving to Confirmado.
  // Returns an array of missing field labels (empty if all good).
  const missingEventFields = (opp) => {
    const missing = [];
    if (!opp?.eventDateTime) missing.push("fecha del evento");
    if (!opp?.startTime) missing.push("hora de inicio");
    if (!opp?.endTime) missing.push("hora de fin");
    return missing;
  };

  // Wrap moveStage to detect Confirmado transitions for eventos
  const moveStageWithCalendar = async (id, newStage, reason) => {
    const prevOpp = opps.find((o) => o.id === id);
    const wasConfirmed = prevOpp?.stage === CONFIRMED_STAGE;
    const movingToConfirmed =
      newStage === CONFIRMED_STAGE && !wasConfirmed && businessUnit === "eventos";

    // Block the transition if required calendar fields are missing
    if (movingToConfirmed) {
      const missing = missingEventFields(prevOpp);
      if (missing.length) {
        alert(
          `No se puede mover a Confirmado sin: ${missing.join(", ")}.\n\n` +
          `Abre la oportunidad y completa estos campos antes de confirmarla.`
        );
        if (prevOpp) setModal({ type: "edit", opp: prevOpp });
        return;
      }
    }

    await moveStage(id, newStage, reason);

    if (movingToConfirmed) {
      const opp = opps.find((o) => o.id === id);
      if (opp) setCalendarPrompt({ ...opp, stage: CONFIRMED_STAGE });
    }
  };

  const filtered = useMemo(() => {
    return opps.filter((o) => {
      if (filters.stage && o.stage !== filters.stage) return false;
      if (filters.priority && o.priority !== filters.priority) return false;
      if (filters.salesperson && o.salesperson !== filters.salesperson) return false;
      if (filters.orgType && o.orgType !== filters.orgType) return false;
      if (filters.sizeRange && !inSizeRange(o.attendees, filters.sizeRange)) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          o.company?.toLowerCase().includes(s) ||
          o.contact?.toLowerCase().includes(s) ||
          o.projectName?.toLowerCase().includes(s) ||
          o.salesperson?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [opps, filters]);

  const handleSave = async (data) => {
    const prevOpp = modal?.opp;
    const wasConfirmed = prevOpp?.stage === CONFIRMED_STAGE;
    const movingToConfirmed =
      data.stage === CONFIRMED_STAGE && !wasConfirmed && businessUnit === "eventos";

    // Block save if moving to Confirmado without required calendar fields
    if (movingToConfirmed) {
      const missing = missingEventFields(data);
      if (missing.length) {
        alert(
          `No se puede mover a Confirmado sin: ${missing.join(", ")}.\n\n` +
          `Completa estos campos antes de guardar.`
        );
        return; // keep modal open so the user can fix it
      }
    }

    if (prevOpp) await updateOpp({ ...data, businessUnit });
    else await addOpp(data);
    setModal(null);

    // Trigger Google Calendar prompt if event was just confirmed
    if (movingToConfirmed) {
      setCalendarPrompt({ ...data, businessUnit, stage: CONFIRMED_STAGE });
    }
  };

  return (
    <div>
      {/* Sub-header: tabs */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 56, zIndex: 39,
        flexWrap: "wrap", gap: 8,
      }}>
        <nav style={{ display: "flex", gap: 2, padding: "8px 0" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? C.accentDim : "transparent",
                color: tab === t.id ? C.accent : C.textDim,
                border: "none", borderRadius: 8, padding: "6px 12px",
                cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setModal({ type: "new" })} style={{ ...btnPrimary, fontSize: 12, padding: "6px 14px" }}>
          + Oportunidad
        </button>
      </div>

      {/* Content */}
      <main style={{ padding: 24 }}>
        {tab === "dashboard" && <Dashboard opps={filtered} filters={filters} setFilters={setFilters} allOpps={opps} />}
        {tab === "kanban" && (
          <KanbanView opps={filtered} moveStage={moveStageWithCalendar}
            onEdit={(o) => setModal({ type: "edit", opp: o })} setModal={setModal}
            filters={filters} setFilters={setFilters} allOpps={opps} />
        )}
        {tab === "list" && (
          <ListView opps={filtered} onEdit={(o) => setModal({ type: "edit", opp: o })}
            onDelete={deleteOpp} moveStage={moveStageWithCalendar} setModal={setModal}
            filters={filters} setFilters={setFilters} allOpps={opps} />
        )}
        {tab === "analytics" && <AnalyticsView opps={filtered} filters={filters} setFilters={setFilters} allOpps={opps} />}
      </main>

      {modal && (
        <OppModal
          opp={modal.opp}
          businessUnit={businessUnit}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onDelete={modal.opp ? () => { deleteOpp(modal.opp.id); setModal(null); } : null}
          defaultSalesperson={user.name}
          moveStage={moveStageWithCalendar}
          setModal={setModal}
        />
      )}
      {modal?.type === "cancel" && (
        <CancelReasonModal
          opp={modal.opp}
          onSave={(reason) => { moveStageWithCalendar(modal.opp.id, CANCELLED_STAGE, reason); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {/* Google Calendar prompt when event moves to Confirmado */}
      {calendarPrompt && (
        <CalendarConfirmModal
          opp={calendarPrompt}
          onClose={() => setCalendarPrompt(null)}
          onSuccess={async (eventId, eventUrl) => {
            // Read the freshest copy of the opp from state; fall back to
            // calendarPrompt if the realtime update hasn't arrived yet.
            // Force stage to CONFIRMED_STAGE so the calendar send never
            // reverts the stage back to its old value.
            const current = opps.find((o) => o.id === calendarPrompt.id) || calendarPrompt;
            await updateOpp({
              ...current,
              businessUnit,
              stage: CONFIRMED_STAGE,
              gcalEventId: eventId,
              gcalEventUrl: eventUrl,
            });
            setCalendarPrompt(null);
          }}
        />
      )}
    </div>
  );
}

/* =================== INLINE FILTERS =================== */
function InlineFilters({ filters, setFilters, opps }) {
  const { config } = useContext(ConfigCtx);
  const salespeople = useMemo(() => [...new Set(opps.map((o) => o.salesperson).filter(Boolean))].sort(), [opps]);
  const allStages = config.stages || DEFAULT_STAGES;
  const hasFilters = Object.values(filters).some(Boolean);
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  const clear = () => setFilters({ search: "", stage: "", salesperson: "", priority: "", orgType: "", sizeRange: "" });

  const micro = {
    ...inputSmall,
    fontSize: 11, padding: "3px 7px", height: 26,
    background: C.surface, border: `1px solid ${C.border}`,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 12 }}>
      <input placeholder="Buscar..." value={filters.search} onChange={(e) => set("search", e.target.value)}
        style={{ ...micro, width: 130 }} />
      <select value={filters.stage} onChange={(e) => set("stage", e.target.value)} style={{ ...micro, cursor: "pointer" }}>
        <option value="">Etapa</option>
        {allStages.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.priority} onChange={(e) => set("priority", e.target.value)} style={{ ...micro, cursor: "pointer" }}>
        <option value="">Prioridad</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {salespeople.length > 0 && (
        <select value={filters.salesperson} onChange={(e) => set("salesperson", e.target.value)} style={{ ...micro, cursor: "pointer" }}>
          <option value="">Vendedor</option>
          {salespeople.map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      <select value={filters.orgType} onChange={(e) => set("orgType", e.target.value)} style={{ ...micro, cursor: "pointer" }}>
        <option value="">Tipo org.</option>
        {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <select value={filters.sizeRange} onChange={(e) => set("sizeRange", e.target.value)} style={{ ...micro, cursor: "pointer" }}>
        <option value="">Tamaño / visitas</option>
        {SIZE_RANGES.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button onClick={clear}
        style={{ ...btnSmall, color: hasFilters ? C.accent : C.textDim, border: `1px solid ${hasFilters ? C.accent : C.border}`, borderRadius: 5, padding: "2px 8px", fontSize: 10 }}>
        ↺
      </button>
    </div>
  );
}

/* =================== DASHBOARD =================== */
function Dashboard({ opps, filters, setFilters, allOpps }) {
  const { config } = useContext(ConfigCtx);
  const stages = config.stages || DEFAULT_STAGES;
  const active = opps.filter((o) => o.stage !== COMPLETED_STAGE && o.stage !== CANCELLED_STAGE);
  const completed = opps.filter((o) => o.stage === COMPLETED_STAGE);
  const cancelled = opps.filter((o) => o.stage === CANCELLED_STAGE);
  const closed = [...completed, ...cancelled];
  const hitRate = pct(completed.length, closed.length);
  const totalActive = active.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const totalCompleted = completed.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const completedThisMonth = completed.filter((o) =>
    (o.history || []).some((e) => e.stage === COMPLETED_STAGE && e.date?.startsWith(thisMonth))
  );
  const completedThisMonthAmt = completedThisMonth.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const now = new Date();
  const avgAgeDays = active.length === 0 ? 0 : Math.round(
    active.reduce((sum, o) => {
      const d = o.createdAt ? new Date(o.createdAt) : now;
      return sum + (now - d) / 86400000;
    }, 0) / active.length
  );
  const ageLabel = avgAgeDays === 0 ? "Sin datos" : `${avgAgeDays} día${avgAgeDays !== 1 ? "s" : ""}`;

  const cards = [
    { label: "Pipeline Activo", value: fmt(totalActive), sub: `${active.length} oportunidades`, color: C.accent },
    { label: "% de Cierre", value: `${hitRate}%`, sub: `${completed.length} completadas / ${closed.length} cerradas`, color: hitRate >= 50 ? C.success : hitRate >= 25 ? C.warn : C.danger },
    { label: "Antigüedad Promedio", value: ageLabel, sub: "días en pipeline activo", color: avgAgeDays > 60 ? C.danger : avgAgeDays > 30 ? C.warn : C.success },
    { label: "Completadas este mes", value: fmt(completedThisMonthAmt), sub: `${completedThisMonth.length} oportunidades`, color: C.accent },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8, overflowX: "auto" }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Dashboard</h2>
        <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
      </div>
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
        {stages.map((s) => {
          const so = opps.filter((o) => o.stage === s);
          const amt = so.reduce((a, o) => a + (Number(o.amount) || 0), 0);
          const maxAmt = Math.max(...stages.map((st) => opps.filter((o) => o.stage === st).reduce((a, o) => a + (Number(o.amount) || 0), 0)), 1);
          const color = getStageColor(s);
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
function KanbanView({ opps, moveStage, onEdit, setModal, filters, setFilters, allOpps }) {
  const { config } = useContext(ConfigCtx);
  const stages = config.stages || DEFAULT_STAGES;
  // Include any legacy/unknown stages present in opps so no card is lost
  const extraStages = [...new Set(opps.map((o) => o.stage).filter((s) => s && !stages.includes(s)))];
  const allColumns = [...stages, ...extraStages];
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDrop = (stage) => {
    if (!dragging) return;
    if (stage === CANCELLED_STAGE) {
      const opp = opps.find((o) => o.id === dragging);
      setModal({ type: "cancel", opp });
    } else {
      moveStage(dragging, stage);
    }
    setDragging(null); setDragOver(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8, overflowX: "auto" }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Kanban</h2>
        <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${allColumns.length},minmax(180px,1fr))`, gap: 10, overflowX: "auto", paddingBottom: 16 }}>
        {allColumns.map((s) => {
          const so = opps.filter((o) => o.stage === s);
          const color = getStageColor(s);
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
              {so.map((o) => {
                const status = getOppStatus(o);
                const priority = o.priority;
                const pColor = PRIORITY_COLOR[priority] || C.textDim;
                return (
                  <div key={o.id} draggable onDragStart={() => setDragging(o.id)} onClick={() => onEdit(o)}
                    style={{ background: C.card, borderRadius: 8, padding: 10, marginBottom: 6, cursor: "grab", fontSize: 12, borderLeft: `2px solid ${color}`, opacity: dragging === o.id ? 0.5 : 1 }}>
                    {/* Source badge + Nombre */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                      <div style={{ fontWeight: 600, flex: 1 }}>{o.projectName || o.company}</div>
                      {o.source === "google_forms" && (
                        <span style={{ fontSize: 9, background: C.accentDim, color: C.accent, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap", fontWeight: 600, letterSpacing: "0.02em" }}>FORMS</span>
                      )}
                    </div>
                    {/* Cliente */}
                    {o.projectName && <div style={{ color: C.textDim, fontSize: 11 }}>👤 {o.company}</div>}
                    {/* Status indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0" }}>
                      <span style={{ fontSize: 10, color: status.color, background: status.color + "20", borderRadius: 4, padding: "1px 6px" }}>
                        {status.icon} {status.label}
                      </span>
                      {priority && (
                        <span style={{ fontSize: 10, color: pColor, background: pColor + "20", borderRadius: 4, padding: "1px 6px" }}>
                          {priority}
                        </span>
                      )}
                    </div>
                    {/* Monto */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, alignItems: "center" }}>
                      <span style={{ color, fontFamily: "Space Mono", fontWeight: 700 }}>{fmt(o.amount || 0)}</span>
                      {o.salesperson && <span style={{ color: C.textDim, fontSize: 10 }}>👤 {o.salesperson}</span>}
                    </div>
                    {o.stage === CANCELLED_STAGE && o.lostReason && (
                      <div style={{ marginTop: 4, fontSize: 10, color: C.danger, background: C.dangerDim, borderRadius: 4, padding: "2px 6px" }}>{o.lostReason}</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =================== LIST =================== */
function downloadExcel(rows) {
  const headers = ["Proyecto/Empresa", "Cliente", "Contacto", "Vendedor", "Tipo Org.", "Prioridad", "Estado", "Monto", "Etapa", "Fecha", "Hora Inicio", "Hora Fin", "# Asistentes", "Notas"];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((o) => [
      o.projectName || o.company, o.projectName ? o.company : "", o.contact, o.salesperson,
      o.orgType, o.priority, OPP_STATUSES.find(s => s.value === o.status)?.label || "A tiempo",
      o.amount, o.stage, o.createdAt, o.startTime, o.endTime, o.attendees, o.notes,
    ].map(escape).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "oportunidades.csv";
  a.click(); URL.revokeObjectURL(url);
}

function ListView({ opps, onEdit, onDelete, moveStage, setModal, filters, setFilters, allOpps }) {
  const { config } = useContext(ConfigCtx);
  const stages = config.stages || DEFAULT_STAGES;
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
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8 }}>
        <h2 style={{ ...h2Style, margin: 0, whiteSpace: "nowrap" }}>Listado de Oportunidades</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 5, overflowX: "auto", flex: 1 }}>
          <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
        </div>
        <button onClick={() => downloadExcel(displayed)} title="Descargar Excel"
          style={{ ...btnSmall, flexShrink: 0, fontSize: 16, padding: "2px 8px", color: C.accent, border: `1px solid ${C.border}`, borderRadius: 6, lineHeight: 1 }}>
          ⬇
        </button>
      </div>
      <div style={{ background: C.card, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, textAlign: "left" }}>
                <th style={thBase}>Proyecto / Empresa</th>
                <th style={thBase}>Contacto</th>
                <th style={thBase}>Vendedor</th>
                <th style={thBase}>Prioridad</th>
                <th style={thBase}>Estado</th>
                <th style={thSort} onClick={() => toggleSort("amount")}>Monto<SortIcon col="amount" /></th>
                <th style={thBase}>Etapa</th>
                <th style={thSort} onClick={() => toggleSort("date")}>Fecha<SortIcon col="date" /></th>
                <th style={thBase}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: C.textDim }}>No hay oportunidades</td></tr>
              )}
              {displayed.map((o) => {
                const status = getOppStatus(o);
                const stageColor = getStageColor(o.stage);
                const pColor = PRIORITY_COLOR[o.priority] || C.textDim;
                return (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{o.projectName || o.company}</div>
                      {o.projectName && <div style={{ fontSize: 11, color: C.textDim }}>{o.company}</div>}
                    </td>
                    <td style={tdStyle}>{o.contact}</td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{o.salesperson}</td>
                    <td style={tdStyle}>
                      {o.priority && (
                        <span style={{ color: pColor, background: pColor + "20", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>{o.priority}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: status.color, fontSize: 12 }}>{status.icon} {status.label}</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "Space Mono", fontWeight: 700, color: stageColor }}>{fmt(o.amount || 0)}</td>
                    <td style={tdStyle}>
                      <select value={o.stage} onChange={(e) => {
                        const ns = e.target.value;
                        if (ns === CANCELLED_STAGE) setModal({ type: "cancel", opp: o });
                        else moveStage(o.id, ns);
                      }} style={{ ...selectSmall, color: stageColor }}>
                        {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ ...tdStyle, color: C.textDim }}>{o.createdAt}</td>
                    <td style={tdStyle}>
                      <button onClick={() => onEdit(o)} style={btnSmall}>Editar</button>
                      <button onClick={() => onDelete(o.id)} style={{ ...btnSmall, color: C.danger, marginLeft: 4 }}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =================== ANALYTICS =================== */
function AnalyticsView({ opps, filters, setFilters, allOpps }) {
  const cancelled = opps.filter((o) => o.stage === CANCELLED_STAGE);
  const reasonCount = {};
  cancelled.forEach((o) => { const r = o.lostReason || "Sin especificar"; reasonCount[r] = (reasonCount[r] || 0) + 1; });
  const sorted = Object.entries(reasonCount).sort((a, b) => b[1] - a[1]);
  const total = cancelled.length;
  // Muted warm palette for pie chart slices
  const pieColors = ["#c15f3c", "#b5882a", "#7a8aa3", "#a88ab5", "#5e7a45", "#8a9e94", "#d1936a", "#b1728a"];

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
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8, overflowX: "auto" }}>
        <h2 style={{ ...h2Style, margin: 0 }}>Análisis</h2>
        <InlineFilters filters={filters} setFilters={setFilters} opps={allOpps} />
      </div>
      <div style={{ background: C.card, borderRadius: 12, padding: 24 }}>
        <div style={{ color: C.textDim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Razones de Cancelación</div>
        {slices.length === 0 ? (
          <div style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: 40 }}>No hay oportunidades canceladas aún</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
            <svg viewBox="0 0 200 200" width={220} height={220}>
              {slices.map((sl, i) => (
                <path key={i} d={sl.angle >= 360 ? describeArc(100, 100, 90, 0, 359.99) : describeArc(100, 100, 90, sl.startAngle, sl.startAngle + sl.angle)}
                  fill={sl.color} stroke={C.card} strokeWidth={2}>
                  <title>{sl.reason}: {sl.pct}%</title>
                </path>
              ))}
              <circle cx={100} cy={100} r={45} fill={C.card} />
              <text x={100} y={95} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={700} fontFamily="Space Mono">{total}</text>
              <text x={100} y={112} textAnchor="middle" fill={C.textDim} fontSize={10}>canceladas</text>
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

/* =================== OPP MODAL =================== */
function OppModal({ opp, businessUnit, onSave, onClose, onDelete, defaultSalesperson, moveStage, setModal }) {
  const { config } = useContext(ConfigCtx);
  const stages = config.stages || DEFAULT_STAGES;
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("details");
  const [form, setForm] = useState(opp || emptyOpp(businessUnit, defaultSalesperson, stages));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!opp;

  const isEventos = businessUnit === "eventos";
  const isProyectos = businessUnit === "proyectos";
  const isExcursiones = businessUnit === "excursiones";

  // Stage history helpers
  const getHistoryDate = (stage) => {
    if (stage === stages[0]) return form.createdAt || "";
    return (form.history || []).findLast?.((e) => e.stage === stage)?.date ||
      (form.history || []).find((e) => e.stage === stage)?.date || "";
  };

  const setHistoryDate = (stage, date) => {
    if (stage === stages[0]) { set("createdAt", date); return; }
    const h = [...(form.history || [])];
    const idx = h.findIndex((e) => e.stage === stage);
    if (idx >= 0) h[idx] = { ...h[idx], date };
    else h.push({ stage, date });
    set("history", h);
  };

  const currentStageIdx = stages.indexOf(form.stage);
  const stagesInHistory = currentStageIdx >= 0
    ? stages.slice(0, currentStageIdx + 1)
    : stages.slice(0, 1);

  const handleSave = () => {
    if (!form.company && !form.projectName) return;
    onSave(form);
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setActiveTab(id)}
      style={{
        background: activeTab === id ? C.accentDim : "transparent",
        color: activeTab === id ? C.accent : C.textDim,
        border: "none", borderRadius: 8, padding: "6px 14px",
        cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
      }}>{label}
    </button>
  );

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: isMobile ? "100%" : 580 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {isEdit ? "Editar Oportunidad" : "Nueva Oportunidad"}
          </h3>
          {/* Prioridad mini-select */}
          <select value={form.priority || "Media"} onChange={(e) => set("priority", e.target.value)}
            style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, border: `1px solid ${PRIORITY_COLOR[form.priority || "Media"]}40`, background: PRIORITY_COLOR[form.priority || "Media"] + "20", color: PRIORITY_COLOR[form.priority || "Media"], cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
            {PRIORITIES.map((p) => <option key={p} value={p}>Prioridad {p}</option>)}
          </select>
          {/* Estado mini-select */}
          <select value={form.status || "a_tiempo"} onChange={(e) => set("status", e.target.value)}
            style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, border: `1px solid ${(OPP_STATUSES.find(s => s.value === (form.status || "a_tiempo"))?.color || C.success) + "40"}`, background: (OPP_STATUSES.find(s => s.value === (form.status || "a_tiempo"))?.color || C.success) + "20", color: OPP_STATUSES.find(s => s.value === (form.status || "a_tiempo"))?.color || C.success, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
            {OPP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          {tabBtn("details", "Detalles")}
          {tabBtn("activities", "Actividades")}
          {isEdit && tabBtn("history", "Historial")}
        </div>

        {/* ── Details tab ── */}
        {activeTab === "details" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {/* Eventos only: Nombre del proyecto (first) */}
              {isEventos && (
                <Field label="Nombre del proyecto">
                  <input value={form.projectName || ""} onChange={(e) => set("projectName", e.target.value)}
                    style={inputStyle} placeholder="Nombre del evento" />
                </Field>
              )}
              <Field label="Empresa / Cliente">
                <input value={form.company} onChange={(e) => set("company", e.target.value)}
                  style={inputStyle} placeholder="Nombre de empresa" />
              </Field>
              <Field label="Contacto">
                <input value={form.contact} onChange={(e) => set("contact", e.target.value)}
                  style={inputStyle} placeholder="Nombre del contacto" />
              </Field>
              <Field label="Vendedor">
                <input value={form.salesperson || ""} onChange={(e) => set("salesperson", e.target.value)}
                  style={inputStyle} placeholder="Nombre del vendedor" />
              </Field>
              {/* Eventos only: Fecha del evento */}
              {isEventos && (
                <Field label="Fecha del evento">
                  <input type="date" value={form.eventDateTime ? form.eventDateTime.slice(0, 10) : ""}
                    onChange={(e) => set("eventDateTime", e.target.value)} style={inputStyle} />
                </Field>
              )}
              {/* Eventos only: # de asistentes */}
              {isEventos && (
                <Field label="# de asistentes">
                  <input type="number" value={form.attendees || ""} onChange={(e) => set("attendees", e.target.value)}
                    style={inputStyle} placeholder="0" min="0" />
                </Field>
              )}
              <Field label="Tipo de organización">
                <select value={form.orgType || ""} onChange={(e) => set("orgType", e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Monto (MXN)">
                <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  style={inputStyle} placeholder="0" />
              </Field>
              <Field label="Fecha de creación">
                <input type="date" value={form.createdAt || today()} max={today()}
                  onChange={(e) => set("createdAt", e.target.value)} style={inputStyle} />
              </Field>
              {isEdit && (
                <Field label="Etapa">
                  <select value={form.stage} onChange={(e) => set("stage", e.target.value)} style={inputStyle}>
                    {stages.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              )}
              {/* Hora inicio + fin — solo Eventos */}
              {isEventos && (
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Hora de inicio">
                    <input type="time" value={form.startTime || ""} onChange={(e) => set("startTime", e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Hora de fin">
                    <input type="time" value={form.endTime || ""} onChange={(e) => set("endTime", e.target.value)} style={inputStyle} />
                  </Field>
                </div>
              )}
            </div>
            <Field label="Notas">
              <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)}
                style={{ ...inputStyle, height: 60, resize: "vertical" }} />
            </Field>
          </div>
        )}

        {/* ── Activities tab ── */}
        {activeTab === "activities" && (
          <ActivitiesPanel
            activities={form.activities || []}
            onUpdate={(acts) => set("activities", acts)}
          />
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <div>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Historial de etapas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stagesInHistory.map((stage) => {
                const date = getHistoryDate(stage);
                const color = getStageColor(stage);
                return (
                  <div key={stage} style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1, color: C.text }}>{stage}</span>
                    <input type="date" value={date} max={today()} onChange={(e) => setHistoryDate(stage, e.target.value)}
                      style={{ ...inputSmall, width: 140, padding: "3px 8px", color: date ? C.text : C.textDim }} />
                  </div>
                );
              })}
            </div>
            {/* Changelog */}
            {(opp?.changelog || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Historial de cambios
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(opp.changelog || []).slice().reverse().map((entry, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.textDim, padding: "4px 8px", background: C.card, borderRadius: 6 }}>
                      <span style={{ color: C.text }}>{entry.date}</span> — {entry.field}: <span style={{ color: C.danger }}>{entry.from}</span> → <span style={{ color: C.success }}>{entry.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isEdit && onDelete && <button onClick={onDelete} style={{ ...btnSmall, color: C.danger }}>Eliminar</button>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} style={btnPrimary}>{isEdit ? "Guardar" : "Crear"}</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/* =================== ACTIVITIES PANEL =================== */
function ActivitiesPanel({ activities, onUpdate }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");

  const COLS = [
    { id: "backlog",     label: "Backlog",     color: "#a8a295" },
    { id: "en_proceso",  label: "En Proceso",  color: "#c15f3c" },
    { id: "completada",  label: "Completada",  color: "#5e7a45" },
  ];

  const pending = activities.filter((a) => a.status !== "completada");
  const overdue = pending.filter((a) => a.dueDate && a.dueDate < today());
  const statusColor = overdue.length > 0 ? C.danger : C.success;
  const statusLabel = overdue.length > 0 ? `⚠ ${overdue.length} tarea${overdue.length > 1 ? "s" : ""} tarde` : "✓ A tiempo";

  const addActivity = () => {
    if (!newTitle.trim()) return;
    const act = { id: uid(), title: newTitle.trim(), status: "backlog", dueDate: newDue, createdAt: today() };
    onUpdate([...activities, act]);
    setNewTitle(""); setNewDue("");
  };

  const moveActivity = (actId, newStatus) =>
    onUpdate(activities.map((a) => (a.id === actId ? { ...a, status: newStatus } : a)));

  const deleteActivity = (actId) =>
    onUpdate(activities.filter((a) => a.id !== actId));

  return (
    <div>
      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ color: statusColor, background: statusColor + "20", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
          {statusLabel}
        </span>
        <span style={{ color: C.textDim, fontSize: 12 }}>{pending.length} pendiente{pending.length !== 1 ? "s" : ""}</span>
      </div>
      {/* Add task */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva tarea..." style={{ ...inputSmall, flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && addActivity()} />
        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
          style={{ ...inputSmall, width: 130 }} title="Fecha límite (opcional)" />
        <button onClick={addActivity} style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>+</button>
      </div>
      {/* Kanban columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {COLS.map((col) => (
          <div key={col.id} style={{ background: C.card, borderRadius: 8, padding: 8, minHeight: 80 }}>
            <div style={{ fontSize: 11, color: col.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
              {col.label}
            </div>
            {activities.filter((a) => (a.status || "backlog") === col.id).map((act) => {
              const isOverdue = act.dueDate && act.dueDate < today() && col.id !== "completada";
              return (
                <div key={act.id} style={{
                  background: C.surface, borderRadius: 6, padding: "6px 8px", marginBottom: 4, fontSize: 12,
                  borderLeft: `2px solid ${isOverdue ? C.danger : col.color}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ flex: 1, lineHeight: 1.3, color: isOverdue ? C.danger : C.text }}>{act.title}</span>
                    <button onClick={() => deleteActivity(act.id)}
                      style={{ ...btnSmall, color: C.textDim, fontSize: 10, padding: "0 2px", lineHeight: 1 }}>×</button>
                  </div>
                  {act.dueDate && (
                    <div style={{ fontSize: 10, color: isOverdue ? C.danger : C.textDim, marginTop: 2 }}>
                      {isOverdue ? "⚠ " : ""}{act.dueDate}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                    {COLS.filter((c) => c.id !== col.id).map((c) => (
                      <button key={c.id} onClick={() => moveActivity(act.id, c.id)}
                        style={{ ...btnSmall, fontSize: 9, background: c.color + "20", color: c.color, borderRadius: 4, padding: "1px 5px" }}>
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

/* =================== CANCEL REASON MODAL =================== */
function CancelReasonModal({ opp, onSave, onClose }) {
  const { config } = useContext(ConfigCtx);
  const reasons = config.lostReasons || LOST_REASONS;
  const [reason, setReason] = useState(reasons[0]);
  const [custom, setCustom] = useState("");

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 400 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: C.danger }}>Oportunidad Cancelada</h3>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16 }}>¿Cuál fue la razón por la que se canceló <b>{opp?.projectName || opp?.company}</b>?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {reasons.map((r) => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, padding: "6px 10px", borderRadius: 8, background: reason === r ? C.dangerDim : "transparent", border: `1px solid ${reason === r ? C.danger : C.border}`, transition: "all .15s" }}>
              <input type="radio" name="cr" checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: C.danger }} />{r}
            </label>
          ))}
        </div>
        {reason === "Otro" && (
          <input placeholder="Especifica la razón" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={() => onSave(reason === "Otro" ? custom || "Otro" : reason)}
            style={{ ...btnPrimary, background: C.danger }}>Marcar como Cancelada</button>
        </div>
      </div>
    </Overlay>
  );
}

/* =================== CALENDAR CONFIRM MODAL =================== */
function CalendarConfirmModal({ opp, onClose, onSuccess }) {
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const hasValidDate = !!(opp?.eventDateTime);

  const sendToCalendar = async () => {
    if (!GCAL_WEBHOOK_URL) {
      setStatus("error");
      setErrorMsg("No hay URL del Web App configurada. Configura VITE_GCAL_WEBHOOK_URL en .env");
      return;
    }
    setStatus("sending");
    try {
      const payload = {
        id: opp.id,
        title: opp.projectName || opp.company || "Evento",
        company: opp.company || "",
        contact: opp.contact || "",
        salesperson: opp.salesperson || "",
        attendees: opp.attendees || "",
        notes: opp.notes || "",
        eventDate: opp.eventDateTime ? opp.eventDateTime.slice(0, 10) : "",
        startTime: opp.startTime || "",
        endTime: opp.endTime || "",
        location: opp.location || "",
      };
      // Apps Script Web Apps no aceptan headers custom en CORS preflight,
      // por eso usamos text/plain para evitar el preflight
      const response = await fetch(GCAL_WEBHOOK_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.ok) {
        setStatus("success");
        setTimeout(() => onSuccess(result.eventId, result.eventUrl), 1200);
      } else {
        throw new Error(result.error || "Error desconocido");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || String(err));
    }
  };

  return (
    <Overlay onClose={status === "sending" ? () => {} : onClose}>
      <div style={{ width: 420, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>Evento Confirmado</h3>
        <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 12px" }}>
          <strong style={{ color: C.text }}>{opp.projectName || opp.company}</strong> ha sido confirmado.
          <br />¿Enviarlo a Google Calendar?
        </p>

        <div style={{ background: C.card, borderRadius: 8, padding: 12, margin: "0 0 16px", textAlign: "left", fontSize: 12, color: C.textDim }}>
          {opp.company && <div>🏢 <strong style={{ color: C.text }}>{opp.company}</strong></div>}
          {opp.contact && <div>👤 {opp.contact}</div>}
          {hasValidDate && (
            <div>
              📆 {opp.eventDateTime.slice(0, 10)}
              {opp.startTime && ` · ${opp.startTime}`}
              {opp.endTime && ` – ${opp.endTime}`}
            </div>
          )}
          {!hasValidDate && (
            <div style={{ color: C.warn }}>⚠ Sin fecha del evento — se usará fecha de creación</div>
          )}
          {opp.attendees && <div>👥 {opp.attendees} asistentes</div>}
        </div>

        {status === "success" && (
          <div style={{ color: C.success, fontSize: 13, marginBottom: 12 }}>
            ✓ Evento creado exitosamente en Google Calendar
          </div>
        )}
        {status === "error" && (
          <div style={{ color: C.danger, fontSize: 12, marginBottom: 12, background: C.dangerDim, padding: "8px 12px", borderRadius: 6 }}>
            Error: {errorMsg}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {status === "idle" && (
            <>
              <button onClick={onClose} style={btnSecondary}>No enviar</button>
              <button onClick={sendToCalendar} style={btnPrimary}>✓ Sí, enviar al Calendar</button>
            </>
          )}
          {status === "sending" && (
            <button disabled style={{ ...btnPrimary, opacity: 0.6 }}>Enviando...</button>
          )}
          {status === "error" && (
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

/* ── Shared UI ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

function Overlay({ children, onClose }) {
  const isMobile = useIsMobile();
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,23,19,0.32)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: isMobile ? 0 : 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? "20px 16px 32px" : 24, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong, width: isMobile ? "100%" : "auto", maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* =================== PROFILE VIEW =================== */
function ProfileView({ user }) {
  const [name, setName] = useState(user.name || "");
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
    else { setPassMsg({ ok: true, text: "Contraseña actualizada" }); setNewPass(""); setConfirmPass(""); }
    setSaving(false);
    setTimeout(() => setPassMsg(null), 3000);
  };

  const card = { background: C.card, borderRadius: 12, padding: 24, marginBottom: 16 };
  return (
    <div>
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
      lost_reasons: localConfig.lostReasons,
    }).eq("id", "default");
    setConfig(localConfig);
    setSaving(false);
  };

  const [resetMsg, setResetMsg] = useState({});
  const sendReset = async (u) => {
    if (!u.email) { setResetMsg({ [u.id]: { ok: false, text: "Sin email" } }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, { redirectTo: window.location.origin });
    setResetMsg({ [u.id]: error ? { ok: false, text: "Error" } : { ok: true, text: "Enviado" } });
    setTimeout(() => setResetMsg({}), 3000);
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

  const sBtn = (id, label) => (
    <button onClick={() => setSection(id)}
      style={{ background: section === id ? C.accentDim : "transparent", color: section === id ? C.accent : C.textDim, border: "none", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
      {label}
    </button>
  );

  return (
    <div>
      <h2 style={h2Style}>Administración</h2>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, width: "fit-content", border: `1px solid ${C.border}` }}>
        {sBtn("users", "👥 Usuarios")}
        {sBtn("passwords", "🔑 Contraseñas")}
        {sBtn("config", "⚙ Configuración")}
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
                      <button onClick={() => toggleRole(u)} disabled={u.id === currentUserId} style={{ ...btnSmall, opacity: u.id === currentUserId ? 0.3 : 1 }}>
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
              <button onClick={() => navigator.clipboard.writeText(window.location.origin)} style={{ ...btnPrimary, padding: "5px 14px", fontSize: 12 }}>Copiar</button>
            </div>
          </div>
        </div>
      )}

      {section === "passwords" && (
        <div style={{ background: C.card, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textDim }}>
            Envía un correo de restablecimiento de contraseña a cualquier usuario.
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
                    <button onClick={() => sendReset(u)} style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>Enviar reset</button>
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
            <EditableList label="Etapas del pipeline (todas las unidades)" field="stages" />
            <EditableList label="Razones de cancelación" field="lostReasons" />
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
      <div style={{ width: 400, background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, boxShadow: C.shadowStrong }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={LOGO} alt={APP_NAME} style={{ height: 48, width: "auto" }} />
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
