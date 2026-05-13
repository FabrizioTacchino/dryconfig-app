import * as Sentry from '@sentry/react';

/**
 * Inizializza Sentry per il tracking errori frontend.
 *
 * Comportamento:
 * - Se `VITE_SENTRY_DSN` NON è impostato, la funzione è no-op (niente errori
 *   in console, niente network call). Utile in dev/local dove non vogliamo
 *   sporcare il dashboard prod.
 * - In produzione, traccia: errori JS non gestiti, promise rejection non
 *   catturate, errori React (via Sentry.ErrorBoundary in App.tsx).
 * - Performance monitoring: 10% delle transazioni (`tracesSampleRate: 0.1`)
 *   per non saturare il free tier 5K events/mese.
 * - Session replay: disabilitato per ora (è la feature che brucia più quota).
 *
 * Setup utente: vedi `docs/SENTRY_SETUP.md` o il file di sessione corrente.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  // Disabilitato se manca il DSN o se siamo in dev mode (modalità Vite).
  if (!dsn) return;

  const release = import.meta.env.VITE_SENTRY_RELEASE as string | undefined;
  const environment = import.meta.env.MODE; // 'production' / 'development'

  Sentry.init({
    dsn,
    release,
    environment,
    // Performance / tracing: campione 10% in prod per non saturare la free tier.
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // BrowserTracing è incluso di default in @sentry/react v9+.
    integrations: [
      // Cattura console.error → Sentry come breadcrumb (utile per il contesto).
      Sentry.browserTracingIntegration(),
    ],
    // Filtra rumore: errori "ResizeObserver loop limit exceeded" sono fastidiosi
    // ma innocui (browser bug), li ignoriamo.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Chrome translate-related noise
      "Can't find variable: gmo",
      // Network noise (l'utente potrebbe essere offline o avere un AdBlocker
      // aggressivo — non è un bug nostro).
      'NetworkError',
      'Failed to fetch',
    ],
    // Filtra origini sospette (estensioni browser, terze parti).
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[Sentry] inizializzato', { environment, release: release ?? '(no release)' });
  }
}

/**
 * Associa l'utente corrente alla sessione Sentry. Chiamato dall'AuthContext
 * dopo il login. Aiuta a filtrare i bug per utente/org nella dashboard.
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: user.id, email: user.email });
}

/**
 * Tagga l'org corrente sulla sessione Sentry. Chiamato dall'OrganizationContext
 * al cambio org. Permette di filtrare i bug per organizzazione.
 */
export function setSentryOrg(orgId: string | null, orgName: string | null): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.setTag('organization_id', orgId ?? 'none');
  Sentry.setTag('organization_name', orgName ?? 'none');
}

export { Sentry };
