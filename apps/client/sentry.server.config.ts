import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d3e0ec76b9e05bdb6e38db0cb95a84d3@o4511174947045376.ingest.de.sentry.io/4511174949470288",
  tracesSampleRate: 1.0,
  debug: false,
});