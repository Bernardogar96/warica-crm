/* ── Core Domain Types ── */

export interface Activity {
  id: string;
  title: string;
  status: 'backlog' | 'en_proceso' | 'completada';
  dueDate: string;
  createdAt: string;
}

export interface HistoryEntry {
  stage: string;
  date: string;
}

export interface ChangelogEntry {
  date: string;
  field: string;
  from: string;
  to: string;
}

export interface Opportunity {
  id: string;
  businessUnit: string;
  company: string;
  contact: string;
  email?: string;
  phone?: string;
  salesperson: string;
  projectName?: string;
  eventDateTime?: string;
  startTime?: string;
  endTime?: string;
  attendees?: string;
  orgType?: string;
  amount: string;
  stage: string;
  status: 'a_tiempo' | 'atrasada' | 'en_pausa';
  priority: 'Alta' | 'Media' | 'Baja';
  notes?: string;
  source?: string;
  lostReason?: string;
  createdAt: string;
  activities: Activity[];
  history: HistoryEntry[];
  changelog?: ChangelogEntry[];
  gcalEventId?: string;
  gcalEventUrl?: string;
  // CRM expansion: client profile link
  clientId?: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  active: boolean;
  created_at: string;
}

export interface CrmConfig {
  stages: string[];
  lostReasons: string[];
}

export interface ConfigCtxValue {
  config: CrmConfig;
  setConfig: (c: CrmConfig) => void;
  isAdmin: boolean;
}

export interface BusinessUnit {
  id: string;
  label: string;
  icon: string;
  logo?: string;
}

/* ── Client / CRM Expansion ── */

export interface ClientContact {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  relationship?: string;
}

export interface Client {
  id: string;
  tradeName: string;
  legalName?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  socialMedia?: Record<string, string>;
  fiscalAddress?: FiscalAddress;
  operationalAddress?: string;
  phones: string[];
  emails: string[];
  contacts: ClientContact[];
  // Fiscal data
  rfc?: string;
  taxRegime?: string;
  cfdiUse?: string;
  invoiceEmail?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalAddress {
  street: string;
  number: string;
  colony: string;
  municipality: string;
  state: string;
  zipCode: string;
  country: string;
}

/* ── Nómina Types ── */

export type EmployeeGroup = 'A' | 'B' | 'C';
export type ContractType = 'indeterminado' | 'determinado' | 'obra' | 'honorarios';
export type EmployeeStatus = 'activo' | 'baja' | 'suspendido';
export type PayrollPeriodType = 'weekly' | 'biweekly' | 'monthly';
export type PayrollPeriodStatus = 'draft' | 'approved' | 'paid';

export interface Employee {
  id: string;
  curp: string;
  rfc: string;
  nss: string;
  fullName: string;
  birthDate: string;
  sex: 'M' | 'F';
  maritalStatus?: string;
  hireDate: string;
  contractType: ContractType;
  group: EmployeeGroup;
  position: string;
  department: string;
  workdayType: 'completa' | 'parcial';
  dailySalary: number;
  sdi: number;
  sbc: number;
  bank?: string;
  clabe?: string;
  status: EmployeeStatus;
  createdAt: string;
}

export interface PayrollConfig {
  id: string;
  year: number;
  uma: number;
  smg: number;
  isrTable: IsrBracket[];
  subsidyTable: SubsidyBracket[];
  vacationTable: VacationEntry[];
  updatedAt: string;
}

export interface IsrBracket {
  lowerLimit: number;
  upperLimit: number;
  fixedFee: number;
  rate: number;
}

export interface SubsidyBracket {
  lowerLimit: number;
  upperLimit: number;
  subsidy: number;
}

export interface VacationEntry {
  yearsWorked: number;
  vacationDays: number;
}

export interface PayrollEntry {
  id: string;
  periodId: string;
  employeeId: string;
  daysWorked: number;
  grossSalary: number;
  overtimeHours: number;
  overtimeAmount: number;
  perceptions: Record<string, number>;
  deductions: Record<string, number>;
  netSalary: number;
  imssEmployee: number;
  imssEmployer: number;
  isrWithheld: number;
  subsidyApplied: number;
}

export interface PayrollPeriod {
  id: string;
  periodType: PayrollPeriodType;
  startDate: string;
  endDate: string;
  group: EmployeeGroup | 'all';
  status: PayrollPeriodStatus;
  totalGross: number;
  totalNet: number;
  totalImssEmployer: number;
  createdAt: string;
}

/* ── Ventas Types ── */

export type ProjectStatus = 'activo' | 'completado' | 'cancelado';
export type InvoiceStatus = 'borrador' | 'emitida' | 'cobrada' | 'cancelada';

export interface Project {
  id: string;
  opportunityId: string;
  clientId: string;
  businessUnit: string;
  projectName: string;
  serviceType: string;
  amount: number;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface InvoiceConcept {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string;
  folio?: string;
  concepts: InvoiceConcept[];
  subtotal: number;
  iva: number;
  total: number;
  status: InvoiceStatus;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  paymentNotes?: string;
  // CFDI fields (nullable until PAC integration)
  cfdiUuid?: string;
  cfdiSeal?: string;
  cfdiChain?: string;
  cfdiPacName?: string;
  cfdiXmlUrl?: string;
  cfdiPdfUrl?: string;
  createdAt: string;
}

/* ── Compras Types ── */

export type PurchaseOrderStatus =
  | 'borrador'
  | 'aprobada'
  | 'enviada'
  | 'recibida_parcial'
  | 'recibida_completa'
  | 'cancelada';

export interface Supplier {
  id: string;
  tradeName: string;
  legalName?: string;
  rfc?: string;
  category: string;
  contact?: ClientContact;
  paymentTerms?: string;
  rating?: number;
  documents?: Record<string, string>;
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  requesterId: string;
  projectId?: string;
  description: string;
  quantity: number;
  unit: string;
  justification: string;
  urgency: 'alta' | 'media' | 'baja';
  status: 'pendiente' | 'cotizando' | 'aprobada' | 'cancelada';
  createdAt: string;
}

export interface PurchaseQuote {
  id: string;
  requestId: string;
  supplierId: string;
  unitPrice: number;
  total: number;
  deliveryDays: number;
  conditions: string;
  selected: boolean;
  selectionNotes?: string;
}

export interface PurchaseOrder {
  id: string;
  requestId: string;
  supplierId: string;
  quoteId: string;
  status: PurchaseOrderStatus;
  total: number;
  issuedAt?: string;
  receivedAt?: string;
  invoiceXmlUrl?: string;
  invoicePdfUrl?: string;
}
