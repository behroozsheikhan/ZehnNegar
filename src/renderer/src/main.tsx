import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { resolveApi } from './api';
import { loadAppFonts } from './fonts';
import './styles/app.css';

async function bootstrap(): Promise<void> {
  // قلم‌ها باید پیش از نخستین رسم تخته آماده باشند (اندازه‌گیری متن گره‌ها).
  const [api] = await Promise.all([resolveApi(), loadAppFonts()]);
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('root element not found');
  }
  createRoot(container).render(
    <StrictMode>
      <App api={api} />
    </StrictMode>
  );
}

void bootstrap();
