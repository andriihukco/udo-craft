"use client";

import { useEffect, useState } from "react";

type CmsBody = Record<string, string>;
type CmsMap  = Record<string, CmsBody>;

let cache: CmsMap | null = null;
let fetchPromise: Promise<CmsMap> | null = null;

async function fetchAll(): Promise<CmsMap> {
  if (cache) return cache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/cms")
    .then((r) => r.json())
    .then((data) => {
      const map: CmsMap = {};
      for (const item of (data.content ?? [])) {
        map[item.slug] = item.body ?? {};
      }
      cache = map;
      return map;
    })
    .catch(() => ({}));

  return fetchPromise;
}

/** Returns a flat map of all CMS slugs → body objects. */
export function useCms() {
  const [cms, setCms] = useState<CmsMap>(cache ?? {});

  useEffect(() => {
    if (cache) { setCms(cache); return; }
    fetchAll().then(setCms);
  }, []);

  /** Get a field value with a fallback. */
  function get(slug: string, key: string, fallback = ""): string {
    return (cms[slug]?.[key] as string) || fallback;
  }

  return { cms, get };
}
