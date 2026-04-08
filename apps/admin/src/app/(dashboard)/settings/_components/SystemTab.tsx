"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import type { AdminHealthResponse, CheckStatus, HealthCheck } from "@/app/api/health/types";

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === "ok") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
      <CheckCircle2 className="size-3.5" /> OK
    </span>
  );
  if (status === "degraded") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
      <AlertTriangle className="size-3.5" /> Degraded
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
      <XCircle className="size-3.5" /> Error
    </span>
  );
}

// ── Check Row ─────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: HealthCheck }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{check.service}</p>
        {check.detail && <p className="text-xs text-muted-foreground truncate max-w-xs">{check.detail}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {check.latency_ms !== null && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />{check.latency_ms}ms
          </span>
        )}
        <StatusBadge status={check.status} />
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

// ── Env Grid ──────────────────────────────────────────────────────────────────

function EnvGrid({ env }: { env: Record<string, boolean> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Object.entries(env).map(([key, set]) => (
        <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40 border border-border/40">
          <span className="text-xs font-mono text-muted-foreground truncate">{key}</span>
          <StatusBadge status={set ? "ok" : "error"} />
        </div>
      ))}
    </div>
  );
}

// ── Deployment Card ───────────────────────────────────────────────────────────

function DeploymentCard({ deployment }: { deployment: AdminHealthResponse["admin"]["deployment"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Environment</p>
        <p className="font-medium capitalize">{deployment.env}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Commit</p>
        <p className="font-mono font-medium">{deployment.sha ?? "—"}</p>
      </div>
      {deployment.message && (
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Message</p>
          <p className="font-medium truncate">{deployment.message}</p>
        </div>
      )}
      {deployment.url && (
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">URL</p>
          <a href={`https://${deployment.url}`} target="_blank" rel="noopener noreferrer"
            className="text-primary text-xs hover:underline truncate block">{deployment.url}</a>
        </div>
      )}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-3 w-24" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SystemTab() {
  const [data, setData] = useState<AdminHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const adminChecks = data?.admin.checks ?? [];
  const supabaseChecks = adminChecks.filter((c) => c.service.startsWith("Supabase"));
  const externalAdminChecks = adminChecks.filter((c) => !c.service.startsWith("Supabase"));

  const clientIsError = data?.client && "status" in data.client && data.client.status === "error";
  const clientChecks = data?.client && !clientIsError ? (data.client as { checks: HealthCheck[] }).checks : [];
  const clientEnv = data?.client && !clientIsError ? (data.client as { env: Record<string, boolean> }).env : null;
  const clientDeployment = data?.client && !clientIsError ? (data.client as { deployment: AdminHealthResponse["admin"]["deployment"] }).deployment : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Стан системи</p>
          {data?.checked_at && (
            <p className="text-xs text-muted-foreground">
              Оновлено: {new Date(data.checked_at).toLocaleString("uk-UA")}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetch_} disabled={loading} className="gap-1.5">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Оновити
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !data && <LoadingSkeleton />}

      {/* Data */}
      {data && (
        <div className="space-y-6">
          {/* Admin section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin App</p>

            <SectionCard title="Supabase">
              {supabaseChecks.map((c) => <CheckRow key={c.service} check={c} />)}
            </SectionCard>

            <SectionCard title="Зовнішні сервіси">
              {externalAdminChecks.map((c) => <CheckRow key={c.service} check={c} />)}
            </SectionCard>

            <SectionCard title="Змінні середовища">
              <EnvGrid env={data.admin.env} />
            </SectionCard>

            <SectionCard title="Деплой">
              <DeploymentCard deployment={data.admin.deployment} />
            </SectionCard>
          </div>

          {/* Client section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client App</p>

            {clientIsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {(data.client as { detail: string }).detail}
              </div>
            ) : (
              <>
                <SectionCard title="Зовнішні сервіси">
                  {clientChecks.map((c) => <CheckRow key={c.service} check={c} />)}
                </SectionCard>

                {clientEnv && (
                  <SectionCard title="Змінні середовища">
                    <EnvGrid env={clientEnv} />
                  </SectionCard>
                )}

                {clientDeployment && (
                  <SectionCard title="Деплой">
                    <DeploymentCard deployment={clientDeployment} />
                  </SectionCard>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
