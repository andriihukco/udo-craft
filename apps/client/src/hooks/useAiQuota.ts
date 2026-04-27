"use client";

import { useState, useEffect, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";

export interface AiQuotaState {
  attemptsUsed: number;
  limit: number;
  isExhausted: boolean;
  loading: boolean;
  increment: () => Promise<void>;
}

const LIMIT = 3;

export function useAiQuota(isAuthenticated: boolean): AiQuotaState {
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    fetch("/api/ai/quota")
      .then((res) => {
        if (res.status === 404) {
          setAttemptsUsed(0);
          return;
        }
        return res.json().then((data) => {
          setAttemptsUsed(data.attempts_used ?? 0);
        });
      })
      .catch((err) => {
        Sentry.captureException(err, { extra: { context: "useAiQuota fetch" } });
        // Fail-open: default to 0 so the user isn't blocked
        setAttemptsUsed(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  const increment = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/quota/increment", { method: "POST" });
      if (!res.ok) {
        throw new Error(`POST /api/ai/quota/increment returned ${res.status}`);
      }
      const data = await res.json();
      setAttemptsUsed(data.attempts_used ?? 0);
    } catch (err) {
      // Silent failure — generation already succeeded; quota recording is non-critical
      Sentry.captureException(err, { extra: { context: "useAiQuota increment" } });
      // Do NOT update local state on failure
    }
  }, []);

  if (!isAuthenticated) {
    return {
      attemptsUsed: 0,
      limit: LIMIT,
      isExhausted: false,
      loading: false,
      increment: async () => {},
    };
  }

  return {
    attemptsUsed,
    limit: LIMIT,
    isExhausted: attemptsUsed >= LIMIT,
    loading,
    increment,
  };
}
