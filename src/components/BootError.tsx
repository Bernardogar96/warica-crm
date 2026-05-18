import { C } from '@/styles/theme';

interface Props {
  message: string;
  onRetry?: () => void;
}

/**
 * Pantalla mostrada cuando el bootstrap inicial falló (ej: error fetching profile).
 * Mejor que dejar al usuario en loading infinito.
 */
export function BootError({ message, onRetry }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          No pudimos cargar tu perfil
        </h2>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          {message}
        </p>
        <button
          onClick={onRetry ?? (() => window.location.reload())}
          style={{
            background: C.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
