/**
 * Background removal — loads @imgly/background-removal via esm.sh CDN.
 * Uses "medium" model for quality solid-color bg removal.
 * Falls back to "small" on OOM (iPad/low-RAM devices).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedFn: ((input: Blob, config?: any) => Promise<Blob>) | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRemoveBgFn(): Promise<(input: Blob, config?: any) => Promise<Blob>> {
  if (cachedFn) return cachedFn;
  const dynamicImport = new Function("url", "return import(url)");
  const mod = await dynamicImport("https://esm.sh/@imgly/background-removal@1.7.0");
  const fn = mod.removeBackground ?? mod.default?.removeBackground ?? mod.default;
  if (typeof fn !== "function") throw new Error("removeBackground not found");
  cachedFn = fn;
  return cachedFn!;
}

async function resizeBlob(blob: Blob, maxPx: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      if (scale >= 1) { resolve(blob); return; }
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(width  * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(blob); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b ?? blob), "image/png", 0.95);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
    img.src = url;
  });
}

function isOomError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes("memory") || msg.includes("backend") || msg.includes("session") || msg.includes("wasm") || msg.includes("oom");
}

export async function removeBgClient(imageUrl: string): Promise<string> {
  let fetchUrl = imageUrl;
  if (imageUrl.startsWith("http")) {
    fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }

  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const rawBlob = await res.blob();

  await new Promise((r) => setTimeout(r, 50));

  const fn = await getRemoveBgFn();

  // Try medium model first (better quality for solid backgrounds)
  // Resize to 1500px — good balance of quality vs memory
  const blobMedium = await resizeBlob(rawBlob, 1500);
  try {
    const result = await fn(blobMedium, {
      model: "medium",
      proxyToWorker: false,
      output: { format: "image/png", quality: 1 },
    });
    return URL.createObjectURL(result);
  } catch (err) {
    if (!isOomError(err)) throw err;
    // OOM — fall back to small model with smaller image
  }

  // Fallback: small model + 1024px resize for low-RAM devices
  const blobSmall = await resizeBlob(rawBlob, 1024);
  try {
    const result = await fn(blobSmall, {
      model: "small",
      proxyToWorker: false,
      output: { format: "image/png", quality: 0.9 },
    });
    return URL.createObjectURL(result);
  } catch (err) {
    if (isOomError(err)) {
      throw new Error("Недостатньо пам'яті для видалення фону. Спробуйте зменшити зображення або використайте інший пристрій.");
    }
    throw err;
  }
}
