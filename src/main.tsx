import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './lib/sentry'

// Inizializza Sentry PRIMA del render React: se React crasha al primo render,
// l'errore va comunque in Sentry. È no-op se VITE_SENTRY_DSN non è settato.
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
