import React from 'react';
import { C } from '@/styles/theme';

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        style={{
          fontSize: 11,
          color: C.textDim,
          display: 'block',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
