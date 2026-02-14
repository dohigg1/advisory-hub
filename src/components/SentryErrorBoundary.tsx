import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function FallbackComponent({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-4">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
          <Button onClick={resetError}>
            Try Again
          </Button>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-4 text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

export function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
      <FallbackComponent error={error as Error} resetError={resetError} />
    )}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
