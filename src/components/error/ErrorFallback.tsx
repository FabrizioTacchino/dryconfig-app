import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | unknown;
  resetError: () => void;
}

/**
 * Schermata di fallback mostrata da Sentry.ErrorBoundary quando un errore React
 * non gestito crasha la UI. Permette all'utente di:
 * - Riprovare (resetError)
 * - Tornare alla home
 *
 * L'errore è già stato inviato a Sentry quando arriva qui.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Qualcosa è andato storto</h1>
          <p className="text-sm text-muted-foreground">
            Abbiamo registrato l'errore e lo controlleremo. Nel frattempo prova a ricaricare la pagina
            o tornare alla dashboard.
          </p>
        </div>
        {import.meta.env.DEV && (
          <details className="text-left bg-muted p-3 rounded text-xs">
            <summary className="cursor-pointer font-medium">Dettagli (solo dev)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{message}</pre>
          </details>
        )}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={resetError}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Riprova
          </Button>
          <Button onClick={() => (window.location.href = '/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Vai alla dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
