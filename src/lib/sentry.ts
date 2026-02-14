import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || "0.1.0",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(b => {
          if (b.data?.url) {
            try {
              const url = new URL(b.data.url);
              url.searchParams.delete("email");
              url.searchParams.delete("token");
              b.data.url = url.toString();
            } catch {}
          }
          return b;
        });
      }
      return event;
    },
  });
}

export function setSentryUser(userId: string, email: string, orgId?: string) {
  Sentry.setUser({ id: userId, email });
  if (orgId) Sentry.setTag("org_id", orgId);
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

export { Sentry };
