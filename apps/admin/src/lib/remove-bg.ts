// Singleton Web Worker wrapper for background removal.
// Keeps the heavy ML work off the main thread so the UI stays responsive.

let worker: Worker | null = null;
const pending = new Map<string, { resolve: (url: string) => void; reject: (e: unknown) => void }>();

function getWorker(): Worker {
  if (worker) return worker;
  // next/webpack understands the `new Worker(new URL(...), { type: "module" })` pattern
  worker = new Worker(new URL("../workers/remove-bg.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<{ id: string; ok: boolean; buf?: ArrayBuffer; mimeType?: string; error?: string }>) => {
    const { id, ok, buf, mimeType, error } = e.data;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    if (ok && buf) {
      const blob = new Blob([buf], { type: mimeType ?? "image/png" });
      p.resolve(URL.createObjectURL(blob));
    } else {
      p.reject(new Error(error ?? "remove-bg failed"));
    }
  };
  worker.onerror = (e) => {
    // Reject all pending on fatal worker error
    pending.forEach((p) => p.reject(e));
    pending.clear();
    worker = null; // will recreate on next call
  };
  return worker;
}

/**
 * Remove background from an image URL.
 * Fetches the image (via proxy if remote), sends it to a Web Worker,
 * and returns an object URL of the result PNG.
 */
export async function removeBg(imageUrl: string): Promise<string> {
  // Fetch the image as a blob on the main thread (fast, non-blocking)
  let fetchUrl = imageUrl;
  if (imageUrl.startsWith("http")) {
    fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.blob();
  const buf = await blob.arrayBuffer();

  return new Promise<string>((resolve, reject) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, blob: buf, mimeType: blob.type }, [buf]);
  });
}
