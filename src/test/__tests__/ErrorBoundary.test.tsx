import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Boom(): ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renderiza hijos cuando todo está bien', () => {
    render(<ErrorBoundary><div>hello</div></ErrorBoundary>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('muestra UI de fallback cuando un hijo lanza', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText(/Algo falló/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('llama onError con el error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    render(<ErrorBoundary onError={onError}><Boom /></ErrorBoundary>);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    spy.mockRestore();
  });
});
