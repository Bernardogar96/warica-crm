import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  C, inputStyle, inputSmall, btnPrimary, btnSecondary, btnSmall,
} from '@/styles/theme';
import {
  SAT_REGIMENES_FISCALES, SAT_USOS_CFDI, PAYMENT_TERMS_OPTIONS,
  MX_STATES, INDUSTRIES, COMPANY_SIZES,
} from '@/lib/catalogs';
import type { Client, ClientContact, FiscalAddress } from '@/types';

interface ClientModalProps {
  client?: Client;
  prefill?: Partial<Client>;
  onSave: (data: Partial<Client>) => Promise<void>;
  onClose: () => void;
}

const emptyFiscal = (): FiscalAddress => ({
  street: '', number: '', colony: '', municipality: '', state: '', zipCode: '', country: 'México',
});

const emptyContact = (): ClientContact => ({
  id: crypto.randomUUID(), name: '', position: '', phone: '', email: '', relationship: '',
});

export function ClientModal({ client, prefill, onSave, onClose }: ClientModalProps) {
  const isMobile = useIsMobile();
  const isEdit = !!client;
  const [tab, setTab] = useState<'general' | 'fiscal' | 'contactos'>('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<Partial<Client>>(() => {
    const base = client || prefill || {};
    return {
      tradeName: base.tradeName || '',
      legalName: base.legalName || '',
      industry: base.industry || '',
      companySize: base.companySize || '',
      website: base.website || '',
      operationalAddress: base.operationalAddress || '',
      phones: base.phones?.length ? base.phones : [''],
      emails: base.emails?.length ? base.emails : [''],
      contacts: base.contacts?.length ? base.contacts : [],
      rfc: base.rfc || '',
      taxRegime: base.taxRegime || '',
      cfdiUse: base.cfdiUse || '',
      invoiceEmail: base.invoiceEmail || base.emails?.[0] || '',
      paymentTerms: base.paymentTerms || '',
      fiscalAddress: base.fiscalAddress || emptyFiscal(),
    };
  });

  const set = <K extends keyof Client>(k: K, v: Client[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setFiscal = (k: keyof FiscalAddress, v: string) =>
    setForm((f) => ({ ...f, fiscalAddress: { ...(f.fiscalAddress || emptyFiscal()), [k]: v } }));

  // Array helpers
  const updatePhone = (i: number, v: string) => {
    const arr = [...(form.phones || [''])];
    arr[i] = v;
    set('phones', arr);
  };
  const addPhone = () => set('phones', [...(form.phones || []), '']);
  const removePhone = (i: number) => set('phones', (form.phones || []).filter((_, j) => j !== i));

  const updateEmail = (i: number, v: string) => {
    const arr = [...(form.emails || [''])];
    arr[i] = v;
    set('emails', arr);
  };
  const addEmail = () => set('emails', [...(form.emails || []), '']);
  const removeEmail = (i: number) => set('emails', (form.emails || []).filter((_, j) => j !== i));

  const addContact = () => set('contacts', [...(form.contacts || []), emptyContact()]);
  const updateContact = (i: number, k: keyof ClientContact, v: string) => {
    const arr = [...(form.contacts || [])];
    arr[i] = { ...arr[i], [k]: v };
    set('contacts', arr);
  };
  const removeContact = (i: number) => set('contacts', (form.contacts || []).filter((_, j) => j !== i));

  const hasFiscalData = !!(form.rfc && form.taxRegime && form.cfdiUse && form.fiscalAddress?.zipCode);

  const handleSave = async () => {
    if (!form.tradeName?.trim()) { setError('El nombre comercial es obligatorio.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        phones: (form.phones || []).filter(Boolean),
        emails: (form.emails || []).filter(Boolean),
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (id: typeof tab, label: string) => (
    <button onClick={() => setTab(id)}
      style={{
        background: tab === id ? C.accentDim : 'transparent',
        color: tab === id ? C.accent : C.textDim,
        border: 'none', borderRadius: 8, padding: '6px 14px',
        cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
      }}>
      {label}
    </button>
  );

  const sectionLabel = (t: string) => (
    <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 16 }}>{t}</div>
  );

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: isMobile ? '100%' : 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {isEdit ? 'Editar Cliente' : 'Nuevo Perfil de Cliente'}
          </h3>
          {hasFiscalData && (
            <span style={{ fontSize: 11, background: C.successDim, color: C.success, borderRadius: 6, padding: '2px 8px' }}>
              ✓ Datos fiscales completos
            </span>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
          {tabBtn('general', 'General')}
          {tabBtn('fiscal', 'Datos Fiscales')}
          {tabBtn('contactos', 'Contactos')}
        </div>

        {/* ── General tab ── */}
        {tab === 'general' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <Field label="Nombre comercial *">
                  <input value={form.tradeName || ''} onChange={(e) => set('tradeName', e.target.value)}
                    style={inputStyle} placeholder="Ej. ACME Corporativo" autoFocus />
                </Field>
              </div>
              <Field label="Razón social">
                <input value={form.legalName || ''} onChange={(e) => set('legalName', e.target.value)}
                  style={inputStyle} placeholder="Razón social completa" />
              </Field>
              <Field label="Giro / Industria">
                <select value={form.industry || ''} onChange={(e) => set('industry', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Tamaño de empresa">
                <select value={form.companySize || ''} onChange={(e) => set('companySize', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Sitio web">
                <input value={form.website || ''} onChange={(e) => set('website', e.target.value)}
                  style={inputStyle} placeholder="https://..." />
              </Field>
            </div>

            {sectionLabel('Teléfonos')}
            {(form.phones || ['']).map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={p} onChange={(e) => updatePhone(i, e.target.value)}
                  style={{ ...inputSmall, flex: 1 }} placeholder={`Teléfono ${i + 1}`} />
                {(form.phones || []).length > 1 && (
                  <button onClick={() => removePhone(i)} style={{ ...btnSmall, color: C.danger }}>×</button>
                )}
              </div>
            ))}
            <button onClick={addPhone} style={{ ...btnSmall, marginBottom: 12 }}>+ Teléfono</button>

            {sectionLabel('Correos electrónicos')}
            {(form.emails || ['']).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={e} onChange={(ev) => updateEmail(i, ev.target.value)}
                  style={{ ...inputSmall, flex: 1 }} placeholder={`correo@empresa.com`} type="email" />
                {(form.emails || []).length > 1 && (
                  <button onClick={() => removeEmail(i)} style={{ ...btnSmall, color: C.danger }}>×</button>
                )}
              </div>
            ))}
            <button onClick={addEmail} style={{ ...btnSmall, marginBottom: 12 }}>+ Correo</button>

            <Field label="Dirección operativa">
              <input value={form.operationalAddress || ''} onChange={(e) => set('operationalAddress', e.target.value)}
                style={inputStyle} placeholder="Dirección donde opera / recibe servicios" />
            </Field>
          </div>
        )}

        {/* ── Fiscal tab ── */}
        {tab === 'fiscal' && (
          <div>
            <div style={{ background: C.warnDim, border: `1px solid ${C.warn}40`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: C.warn }}>
              ⚠ Los datos fiscales son necesarios para generar facturas. Completa todos los campos antes de cerrar una oportunidad como "Cerrado Ganado".
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <Field label="RFC *">
                <input value={form.rfc || ''} onChange={(e) => set('rfc', e.target.value.toUpperCase())}
                  style={inputStyle} placeholder="XAXX010101000" maxLength={13} />
              </Field>
              <Field label="Razón social exacta (SAT)">
                <input value={form.legalName || ''} onChange={(e) => set('legalName', e.target.value)}
                  style={inputStyle} placeholder="Como aparece en constancia SAT" />
              </Field>
              <Field label="Régimen fiscal *">
                <select value={form.taxRegime || ''} onChange={(e) => set('taxRegime', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {SAT_REGIMENES_FISCALES.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Uso de CFDI *">
                <select value={form.cfdiUse || ''} onChange={(e) => set('cfdiUse', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {SAT_USOS_CFDI.map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
                </select>
              </Field>
              <Field label="Correo para facturas">
                <input value={form.invoiceEmail || ''} onChange={(e) => set('invoiceEmail', e.target.value)}
                  style={inputStyle} placeholder="facturas@empresa.com" type="email" />
              </Field>
              <Field label="Condiciones de pago">
                <select value={form.paymentTerms || ''} onChange={(e) => set('paymentTerms', e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {PAYMENT_TERMS_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            {sectionLabel('Dirección fiscal *')}
            <div style={{ background: C.surface, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 10 }}>
                <Field label="Calle">
                  <input value={form.fiscalAddress?.street || ''} onChange={(e) => setFiscal('street', e.target.value)}
                    style={inputSmall} placeholder="Nombre de la calle" />
                </Field>
                <Field label="Número">
                  <input value={form.fiscalAddress?.number || ''} onChange={(e) => setFiscal('number', e.target.value)}
                    style={inputSmall} placeholder="Ext / Int" />
                </Field>
                <Field label="Colonia">
                  <input value={form.fiscalAddress?.colony || ''} onChange={(e) => setFiscal('colony', e.target.value)}
                    style={inputSmall} placeholder="Colonia" />
                </Field>
                <Field label="Código Postal">
                  <input value={form.fiscalAddress?.zipCode || ''} onChange={(e) => setFiscal('zipCode', e.target.value)}
                    style={inputSmall} placeholder="00000" maxLength={5} />
                </Field>
                <Field label="Municipio / Alcaldía">
                  <input value={form.fiscalAddress?.municipality || ''} onChange={(e) => setFiscal('municipality', e.target.value)}
                    style={inputSmall} placeholder="Municipio" />
                </Field>
                <Field label="Estado">
                  <select value={form.fiscalAddress?.state || ''} onChange={(e) => setFiscal('state', e.target.value)} style={inputSmall}>
                    <option value="">— Estado —</option>
                    {MX_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── Contactos tab ── */}
        {tab === 'contactos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: C.textDim }}>Contactos clave del cliente</span>
              <button onClick={addContact} style={{ ...btnPrimary, padding: '5px 14px', fontSize: 12 }}>+ Contacto</button>
            </div>
            {(form.contacts || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: C.textDim, fontSize: 13 }}>
                Sin contactos registrados. Agrega al menos uno.
              </div>
            )}
            {(form.contacts || []).map((contact, i) => (
              <div key={contact.id || i} style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Contacto {i + 1}</span>
                  <button onClick={() => removeContact(i)} style={{ ...btnSmall, color: C.danger, fontSize: 11 }}>Eliminar</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <Field label="Nombre">
                    <input value={contact.name} onChange={(e) => updateContact(i, 'name', e.target.value)}
                      style={inputSmall} placeholder="Nombre completo" />
                  </Field>
                  <Field label="Puesto">
                    <input value={contact.position} onChange={(e) => updateContact(i, 'position', e.target.value)}
                      style={inputSmall} placeholder="Director, Gerente..." />
                  </Field>
                  <Field label="Teléfono">
                    <input value={contact.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)}
                      style={inputSmall} placeholder="+52 555 000 0000" />
                  </Field>
                  <Field label="Correo">
                    <input value={contact.email} onChange={(e) => updateContact(i, 'email', e.target.value)}
                      style={inputSmall} placeholder="contacto@empresa.com" type="email" />
                  </Field>
                  <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <Field label="Relación con Warica">
                      <input value={contact.relationship || ''} onChange={(e) => updateContact(i, 'relationship', e.target.value)}
                        style={inputSmall} placeholder="Ej. Decisor, Usuario final, Pagador..." />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 8 }}>{error}</div>}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
