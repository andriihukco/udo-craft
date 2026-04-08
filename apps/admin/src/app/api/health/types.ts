export type CheckStatus = "ok" | "degraded" | "error";

export interface HealthCheck {
  service: string;
  status: CheckStatus;
  latency_ms: number | null;
  detail: string | null;
}

export interface DeploymentInfo {
  env: string;
  url: string | null;
  sha: string | null;
  message: string | null;
}

export interface AdminHealthResponse {
  checked_at: string;
  admin: {
    checks: HealthCheck[];
    env: Record<string, boolean>;
    deployment: DeploymentInfo;
  };
  client:
    | {
        checks: HealthCheck[];
        env: Record<string, boolean>;
        deployment: DeploymentInfo;
      }
    | { status: "error"; detail: string; checks: HealthCheck[] };
}

export interface ClientHealthResponse {
  checked_at: string;
  checks: HealthCheck[];
  env: Record<string, boolean>;
  deployment: DeploymentInfo;
}
