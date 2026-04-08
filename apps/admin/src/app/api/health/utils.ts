import type { CheckStatus, DeploymentInfo, HealthCheck } from "./types";

export async function runCheck(
  service: string,
  fn: () => Promise<Omit<HealthCheck, "service">>
): Promise<HealthCheck> {
  try {
    const result = await fn();
    return { service, ...result };
  } catch (err) {
    return {
      service,
      status: "error",
      latency_ms: null,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export function checkSentryDsn(dsn: string | undefined): Omit<HealthCheck, "service"> {
  if (!dsn) return { status: "error", latency_ms: null, detail: "DSN not configured" };
  try {
    new URL(dsn);
    return { status: "ok", latency_ms: null, detail: null };
  } catch {
    return { status: "error", latency_ms: null, detail: "DSN not configured" };
  }
}

export function checkClarityId(id: string | undefined): Omit<HealthCheck, "service"> {
  if (id && id.length > 0) return { status: "ok", latency_ms: null, detail: null };
  return { status: "degraded", latency_ms: null, detail: "Clarity ID not found in config" };
}

export function buildDeploymentInfo(): DeploymentInfo {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return {
    env: process.env.VERCEL_ENV ?? "local",
    url: process.env.VERCEL_URL ?? null,
    sha: sha ? sha.slice(0, 7) : null,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
  };
}
