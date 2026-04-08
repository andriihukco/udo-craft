import { NextResponse } from "next/server";

type CheckStatus = "ok" | "degraded" | "error";

interface HealthCheck {
  service: string;
  status: CheckStatus;
  latency_ms: number | null;
  detail: string | null;
}

interface DeploymentInfo {
  env: string;
  url: string | null;
  sha: string | null;
  message: string | null;
}

const CLIENT_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SENTRY_DSN",
] as const;

const CLIENT_CLARITY_ID = "w7kk9avzfh";

function checkSentryDsn(dsn: string | undefined): Omit<HealthCheck, "service"> {
  if (!dsn) return { status: "error", latency_ms: null, detail: "DSN not configured" };
  try {
    new URL(dsn);
    return { status: "ok", latency_ms: null, detail: null };
  } catch {
    return { status: "error", latency_ms: null, detail: "DSN not configured" };
  }
}

function checkClarityId(id: string | undefined): Omit<HealthCheck, "service"> {
  if (id && id.length > 0) return { status: "ok", latency_ms: null, detail: null };
  return { status: "degraded", latency_ms: null, detail: "Clarity ID not found in config" };
}

function buildDeploymentInfo(): DeploymentInfo {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return {
    env: process.env.VERCEL_ENV ?? "local",
    url: process.env.VERCEL_URL ?? null,
    sha: sha ? sha.slice(0, 7) : null,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
  };
}

export async function GET() {
  const checks: HealthCheck[] = await Promise.all([
    Promise.resolve({ service: "Sentry", ...checkSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN) }),
    Promise.resolve({ service: "Clarity", ...checkClarityId(CLIENT_CLARITY_ID) }),
  ]);

  const env: Record<string, boolean> = {};
  for (const key of CLIENT_ENV_VARS) {
    env[key] = !!process.env[key];
  }

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    checks,
    env,
    deployment: buildDeploymentInfo(),
  });
}
