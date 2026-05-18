import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Mock global de import.meta.env para tests
vi.stubGlobal('importMetaEnv', {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
});

// Mock de matchMedia (algunos componentes lo usan vía useIsMobile)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// crypto.randomUUID en jsdom (puede faltar en Node viejo)
if (!('randomUUID' in crypto)) {
  // @ts-expect-error patch
  crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).slice(2);
}
