import * as Sentry from "@sentry/nextjs";

declare global {
  interface Window { __SENTRY_INITIALIZED__?: boolean; }
}

if (!window.__SENTRY_INITIALIZED__) {
  window.__SENTRY_INITIALIZED__ = true;

  Sentry.init({
    dsn: "https://c4499391bcf9562150350326d96bbdfd@o4511174947045376.ingest.de.sentry.io/4511186651906128",
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
