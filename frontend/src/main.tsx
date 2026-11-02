import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource/instrument-serif/latin-400.css';
import '@/styles/index.css';
import App from '@/app/App';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
