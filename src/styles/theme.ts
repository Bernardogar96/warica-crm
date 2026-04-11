import type { Opportunity, BusinessUnit, CrmConfig } from '@/types';

/* ── App Identity ── */
export const LOGO = '/logo.jpeg';
export const APP_NAME = 'Abuelo CRM';

/* ── Pipeline Stages ── */
export const DEFAULT_STAGES = [
  'Backlog',
  'Cotizado',
  'Confirmado',
  'Cerrado Ganado',
  'Completado',
  'Cancelado',
];
export const COMPLETED_STAGE = 'Completado';
export const WON_STAGE = 'Cerrado Ganado';
export const CANCELLED_STAGE = 'Cancelado';
export const CONFIRMED_STAGE = 'Confirmado';
export const QUOTED_STAGE = 'Cotizado';
// Legacy aliases
export const LOST_STAGE = CANCELLED_STAGE;

/* ── Business Units ── */
export const BUSINESS_UNITS: BusinessUnit[] = [
  { id: 'eventos', label: 'Eventos Warica', icon: '🎪', logo: '/warica-logo.png' },
  { id: 'proyectos', label: 'Proyectos del Abuelo', icon: '🏗', logo: '/abuelo-logo.png' },
  { id: 'excursiones', label: 'Excursiones', icon: '🏕' },
];

/* ── CRM Tabs ── */
export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'kanban', label: 'Kanban', icon: '▦' },
  { id: 'list', label: 'Listado', icon: '☰' },
  { id: 'analytics', label: 'Análisis', icon: '◴' },
];

/* ── Priorities ── */
export const PRIORITIES = ['Alta', 'Media', 'Baja'] as const;
export const PRIORITY_COLOR: Record<string, string> = {
  Alta: '#b34a3a',
  Media: '#b5882a',
  Baja: '#7a9b6e',
};

/* ── Opportunity Statuses ── */
export const OPP_STATUSES = [
  { value: 'a_tiempo', label: 'A tiempo', color: '#5e7a45', icon: '✓' },
  { value: 'atrasada', label: 'Atrasada', color: '#b34a3a', icon: '⚠' },
  { value: 'en_pausa', label: 'En pausa', color: '#b5882a', icon: '⏸' },
] as const;

/* ── Org / Size ── */
export const ORG_TYPES = ['Empresa', 'Colegio', 'Gobierno', 'ONG', 'Asociación', 'Otro'];
export const SIZE_RANGES = ['1-10', '11-50', '51-100', '101-200', '200+'];

/* ── Lost Reasons (defaults, overridable via crm_config) ── */
export const LOST_REASONS = [
  'Precio muy alto',
  'Eligió competencia',
  'Sin presupuesto',
  'No respondió',
  'Timing inadecuado',
  'No era decisor',
  'Cambio de prioridades',
  'Otro',
];

/* ── Google Calendar Webhook ── */
export const GCAL_WEBHOOK_URL = import.meta.env.VITE_GCAL_WEBHOOK_URL || '';

/* ── Color Palette ── */
export const C = {
  bg: '#faf9f5',
  surface: '#f5f1e8',
  card: '#ffffff',
  cardAlt: '#fbf9f3',
  border: '#ebe4d3',
  borderStrong: '#d9cfb8',
  accent: '#c15f3c',
  accentHover: '#a94e2e',
  accentDim: '#c15f3c14',
  danger: '#b34a3a',
  dangerDim: '#b34a3a14',
  warn: '#b5882a',
  warnDim: '#b5882a14',
  success: '#5e7a45',
  successDim: '#5e7a4514',
  text: '#1a1713',
  textStrong: '#0c0a08',
  textDim: '#7a7466',
  textMuted: '#a39c8a',
  white: '#fff',
  shadow: '0 1px 2px rgba(20,15,8,0.04), 0 2px 8px rgba(20,15,8,0.03)',
  shadowStrong: '0 2px 4px rgba(20,15,8,0.05), 0 8px 24px rgba(20,15,8,0.06)',
} as const;

/* ── Shared Style Objects ── */
export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '9px 13px',
  color: C.text,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
};
export const inputSmall: React.CSSProperties = {
  ...inputStyle,
  padding: '6px 11px',
  fontSize: 12,
  borderRadius: 8,
};
export const selectSmall: React.CSSProperties = { ...inputSmall, cursor: 'pointer' };
export const btnPrimary: React.CSSProperties = {
  background: C.accent,
  color: C.white,
  border: 'none',
  borderRadius: 10,
  padding: '9px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.005em',
  transition: 'background-color 120ms ease, transform 80ms ease',
};
export const btnSecondary: React.CSSProperties = {
  background: C.white,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '9px 20px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.005em',
  transition: 'border-color 120ms ease, background-color 120ms ease',
};
export const btnSmall: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: C.accent,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  padding: '2px 6px',
};
export const tdStyle: React.CSSProperties = {
  padding: '11px 14px',
  verticalAlign: 'middle',
};
export const h2Style: React.CSSProperties = {
  margin: '0 0 18px',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '-0.018em',
  color: C.textStrong,
};

/* ── Helper Functions ── */
export const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n);

export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const today = () => new Date().toISOString().slice(0, 10);

export const hasValidAmount = (opp: Partial<Opportunity>) => {
  const n = Number(opp?.amount);
  return !isNaN(n) && n > 0;
};

export const getStageColor = (stage: string): string => {
  const MAP: Record<string, string> = {
    Backlog: '#a8a295',
    Cotizado: '#7a8aa3',
    Confirmado: '#c15f3c',
    'Cerrado Ganado': '#5e7a45',
    Completado: '#5e7a45',
    Cancelado: '#b34a3a',
  };
  return MAP[stage] || '#a8a295';
};

export const getOppStatus = (opp: Partial<Opportunity>) =>
  OPP_STATUSES.find((s) => s.value === opp.status) || OPP_STATUSES[0];

export const inSizeRange = (val: string | undefined, range: string): boolean => {
  if (!range || !val) return true;
  const n = Number(val);
  if (isNaN(n)) return false;
  if (range === '200+') return n > 200;
  const [lo, hi] = range.split('-').map(Number);
  return n >= lo && n <= hi;
};

export const emptyOpp = (
  unit: string,
  salesperson: string,
  stages: string[],
): Partial<Opportunity> => ({
  company: '',
  contact: '',
  salesperson: salesperson || '',
  projectName: '',
  eventDateTime: '',
  attendees: '',
  orgType: '',
  startTime: '',
  endTime: '',
  amount: '',
  priority: 'Media',
  status: 'a_tiempo',
  notes: '',
  stage: (stages || DEFAULT_STAGES)[0],
  businessUnit: unit,
  createdAt: today(),
  activities: [],
  history: [],
});

export const emptyConfig = (): CrmConfig => ({
  stages: DEFAULT_STAGES,
  lostReasons: LOST_REASONS,
});
