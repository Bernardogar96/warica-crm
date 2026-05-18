import React from 'react';
import { C } from '@/styles/theme';

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  /** Si tienes Sentry inicializado, pásalo aquí para reportar el crash */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] app crash', error, info);
    this.props.onError?.(error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

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
            maxWidth: 560,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Algo falló y la app no pudo continuar
          </h2>
          <p style={{ color: C.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            Refresca la página. Si vuelve a pasar, manda este mensaje a soporte para
            que lo revisemos.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: '#1a1713',
                color: '#fbb',
                padding: 12,
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'Space Mono, monospace',
                overflow: 'auto',
                maxHeight: 200,
                marginBottom: 16,
              }}
            >
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
            </pre>
          )}
          <button
            onClick={this.handleReload}
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
            Refrescar página
          </button>
        </div>
      </div>
    );
  }
}
