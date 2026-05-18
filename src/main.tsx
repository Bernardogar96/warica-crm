import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initSentry } from './lib/sentry';

// Inicializa Sentry antes de montar React. No-op si VITE_SENTRY_DSN no está
// o si @sentry/react no está instalado. No bloqueamos el render esperándolo.
void initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
