import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c4499391bcf9562150350326d96bbdfd@o4511174947045376.ingest.de.sentry.io/4511186651906128",
  tracesSampleRate: 1.0,
  debug: false,
});
