import * as Sentry from "@sentry/nextjs";

declare global {
  interface Window { __SENTRY_INITIALIZED__?: boolean; }
}

if (!window.__SENTRY_INITIALIZED__) {
  window.__SENTRY_INITIALIZED__ = true;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 1,
    enableLogs: true,
    sendDefaultPii: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
