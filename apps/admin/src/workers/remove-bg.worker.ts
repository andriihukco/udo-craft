// Web Worker — runs background removal off the main thread
// Dynamic import inside handler prevents SWC/webpack from processing @imgly at build time

self.onmessage = async (e: MessageEvent<{ id: string; blob: ArrayBuffer; mimeType: string }>) => {
  const { id, blob, mimeType } = e.data;
  try {
    const { removeBackground } = await import("@imgly/background-removal");
    const inputBlob = new Blob([blob], { type: mimeType });
    const resultBlob = await removeBackground(inputBlob);
    const buf = await resultBlob.arrayBuffer();
    self.postMessage({ id, ok: true, buf, mimeType: resultBlob.type }, { transfer: [buf] });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err) });
  }
};
