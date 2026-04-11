/* ── SAT Catálogos México ── */

export const SAT_REGIMENES_FISCALES = [
  { code: '601', label: '601 – General de Ley Personas Morales' },
  { code: '603', label: '603 – Personas Morales con Fines no Lucrativos' },
  { code: '605', label: '605 – Sueldos y Salarios e Ingresos Asimilados' },
  { code: '606', label: '606 – Arrendamiento' },
  { code: '608', label: '608 – Demás ingresos' },
  { code: '612', label: '612 – Personas Físicas con Actividades Empresariales y Profesionales' },
  { code: '616', label: '616 – Sin obligaciones fiscales' },
  { code: '621', label: '621 – Incorporación Fiscal' },
  { code: '625', label: '625 – Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { code: '626', label: '626 – Régimen Simplificado de Confianza (RESICO)' },
];

export const SAT_USOS_CFDI = [
  { code: 'G01', label: 'G01 – Adquisición de mercancias' },
  { code: 'G02', label: 'G02 – Devoluciones, descuentos o bonificaciones' },
  { code: 'G03', label: 'G03 – Gastos en general' },
  { code: 'I01', label: 'I01 – Construcciones' },
  { code: 'I02', label: 'I02 – Mobilario y equipo de oficina por inversiones' },
  { code: 'I03', label: 'I03 – Equipo de transporte' },
  { code: 'I04', label: 'I04 – Equipo de computo y accesorios' },
  { code: 'I05', label: 'I05 – Dados, troqueles, moldes, matrices y herramental' },
  { code: 'I06', label: 'I06 – Comunicaciones telefónicas' },
  { code: 'I07', label: 'I07 – Comunicaciones satelitales' },
  { code: 'I08', label: 'I08 – Otra maquinaria y equipo' },
  { code: 'D01', label: 'D01 – Honorarios médicos, dentales y gastos hospitalarios' },
  { code: 'D02', label: 'D02 – Gastos médicos por incapacidad o discapacidad' },
  { code: 'D03', label: 'D03 – Gastos funerales' },
  { code: 'D04', label: 'D04 – Donativos' },
  { code: 'D07', label: 'D07 – Primas por seguros de gastos médicos' },
  { code: 'D10', label: 'D10 – Pagos por servicios educativos (colegiaturas)' },
  { code: 'P01', label: 'P01 – Por definir' },
  { code: 'S01', label: 'S01 – Sin efectos fiscales' },
  { code: 'CP01', label: 'CP01 – Pagos' },
  { code: 'CN01', label: 'CN01 – Nómina' },
];

export const PAYMENT_TERMS_OPTIONS = [
  'Contado',
  'Crédito 15 días',
  'Crédito 30 días',
  'Crédito 45 días',
  'Crédito 60 días',
  'Crédito 90 días',
  'Anticipo 50% + 50% al entregar',
  'Anticipo 30% + 70% al entregar',
];

export const MX_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
  'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatán', 'Zacatecas',
];

export const INDUSTRIES = [
  'Aeronáutica y Defensa',
  'Agroindustria',
  'Arquitectura y Diseño',
  'Automotriz',
  'Banca y Finanzas',
  'Construcción e Inmobiliaria',
  'Consultoría',
  'Educación',
  'Energía',
  'Entretenimiento y Cultura',
  'Farmacéutica y Salud',
  'Gobierno y Sector Público',
  'Hotelería y Turismo',
  'Industria Manufacturera',
  'Logística y Transporte',
  'Medios y Comunicación',
  'ONG / Asociación Civil',
  'Retail y Comercio',
  'Servicios Corporativos',
  'Tecnología',
  'Telecomunicaciones',
  'Otro',
];

export const COMPANY_SIZES = [
  'Microempresa (1-10)',
  'Pequeña (11-50)',
  'Mediana (51-250)',
  'Grande (251-1000)',
  'Corporativo (1000+)',
];

/* ── Nómina / IMSS ── */

/** Tasas patronales IMSS 2025 fijas (excluye prima de riesgo) */
export const IMSS_PATRON_RATES = {
  /** Enfermedad y Maternidad – cuota fija (sobre 1 UMA diaria × 30) */
  eyMCuotaFija: 0.204, // 20.4% sobre la parte igual al SMG
  /** Enfermedad y Maternidad – sobre excedente de 3 UMAs */
  eyMExcedente: 0.011, // 1.1%
  /** Pensionados y Beneficiarios */
  pensionados: 0.0105, // 1.05%
  /** Invalidez y Vida */
  invalidezVida: 0.0175, // 1.75%
  /** Guarderías y Prestaciones Sociales */
  guarderias: 0.01, // 1%
  /** Cesantía y Vejez – patronal */
  cesantiaVejez: 0.0350, // 3.5%
  /** INFONAVIT */
  infonavit: 0.05, // 5%
  /** SAR/AFORE */
  sar: 0.02, // 2%
};

/** Tasas obreras IMSS 2025 */
export const IMSS_OBRERO_RATES = {
  eyMExcedente: 0.004, // 0.4% sobre excedente de 3 UMAs
  pensionados: 0.00375, // 0.375%
  invalidezVida: 0.00625, // 0.625%
  cesantiaVejez: 0.01125, // 1.125%
};

/** Días de vacaciones mínimos LFT */
export const VACATION_TABLE_LFT = [
  { years: 1, days: 12 },
  { years: 2, days: 14 },
  { years: 3, days: 16 },
  { years: 4, days: 18 },
  { years: 5, days: 20 },
  { years: 6, days: 22 },
  { years: 10, days: 24 },
  { years: 15, days: 26 },
  { years: 20, days: 28 },
  { years: 25, days: 30 },
];

export const SUPPLIER_CATEGORIES = [
  'Herramienta y Equipo',
  'Materiales',
  'Servicios',
  'Subcontratistas',
  'Transporte y Logística',
  'Tecnología',
  'Papelería y Oficina',
  'Otro',
];
