import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import { Field } from '@/components/Field';
import { C, inputStyle, btnPrimary, btnSecondary } from '@/styles/theme';
import { SUPPLIER_CATEGORIES, PAYMENT_TERMS_OPTIONS } from '@/lib/catalogs';
import type { Supplier } from '@/types';

interface Props {
  supplier?: Supplier;
  onSave: (data: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

export function SupplierModal({ supplier, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    tradeName: supplier?.tradeName || '',
    legalName: supplier?.legalName || '',
    rfc: supplier?.rfc || '',
    category: supplier?.category || SUPPLIER_CATEGORIES[0],
    paymentTerms: supplier?.paymentTerms || '',
    rating: supplier?.rating || 0,
    contactName: supplier?.contact?.name || '',
    contactEmail: supplier?.contact?.email || '',
    contactPhone: supplier?.contact?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.tradeName) return;
    setSaving(true);
    try {
      await onSave({
        tradeName: form.tradeName,
        legalName: form.legalName || undefined,
        rfc: form.rfc || undefined,
        category: form.category,
        paymentTerms: form.paymentTerms || undefined,
        rating: form.rating || undefined,
        contact: form.contactName ? {
          id: supplier?.contact?.id || crypto.randomUUID(),
          name: form.contactName,
          position: '',
          phone: form.contactPhone,
          email: form.contactEmail,
        } : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 480 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>
          {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Nombre comercial *">
            <input value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)}
              style={inputStyle} placeholder="Nombre del proveedor" />
          </Field>
          <div style={grid2}>
            <Field label="Razón social">
              <input value={form.legalName} onChange={(e) => set('legalName', e.target.value)}
                style={inputStyle} />
            </Field>
            <Field label="RFC">
              <input value={form.rfc} onChange={(e) => set('rfc', e.target.value.toUpperCase())}
                style={inputStyle} maxLength={13} />
            </Field>
            <Field label="Categoría">
              <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
                {SUPPLIER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Condiciones de pago">
              <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} style={inputStyle}>
                <option value="">— Seleccionar —</option>
                {PAYMENT_TERMS_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Calificación (1-5)">
              <input type="number" min="1" max="5" step="0.5" value={form.rating || ''}
                onChange={(e) => set('rating', Number(e.target.value))}
                style={inputStyle} placeholder="—" />
            </Field>
          </div>

          {/* Contact */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Contacto principal
            </div>
            <div style={grid2}>
              <Field label="Nombre">
                <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Teléfono">
                <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)}
                  style={inputStyle} />
              </Field>
              <Field label="Email" style={{ gridColumn: '1 / -1' }}>
                <input value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)}
                  style={inputStyle} />
              </Field>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Guardando…' : supplier ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
