import * as Sentry from "@sentry/nextjs";

declare global {
  interface Window { __SENTRY_INITIALIZED__?: boolean; }
}

// Guard against multiple initializations
if (typeof window !== "undefined" && !window.__SENTRY_INITIALIZED__) {
  window.__SENTRY_INITIALIZED__ = true;

  Sentry.init({
    dsn: "https://d3e0ec76b9e05bdb6e38db0cb95a84d3@o4511174947045376.ingest.de.sentry.io/4511174949470288",
    integrations: [
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}
