"use client";

// This component is ONLY loaded client-side via dynamic import (ssr: false).
// Never import it directly — always use the dynamic wrapper in BlockEditor.tsx.

import { useCallback, useEffect, useState } from "react";
import { useCreateBlockNote, BlockNoteViewEditor } from "@blocknote/react";
import "@blocknote/react/style.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RefreshCw, Eye, EyeOff, ExternalLink } from "lucide-react";

interface Props {
  slug: string;
  pageTitle: string;
  description?: string;
  previewUrl?: string;
}

export default function BlockNoteEditor({ slug, pageTitle, description, previewUrl }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // Safe to call here — this component is never SSR'd
  const editor = useCreateBlockNote();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms?slug=${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.content?.body) {
        setTitle(data.content.body.title ?? "");
        const blocks = data.content.body.blocks;
        if (Array.isArray(blocks) && blocks.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await editor.replaceBlocks(editor.document, blocks as any);
        }
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, [slug, editor]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: pageTitle, body: { title, blocks: editor.document } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Збережено");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!preview) {
      const html = await editor.blocksToHTMLLossy(editor.document);
      setPreviewHtml(html);
    }
    setPreview((p) => !p);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
          {description && <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Відкрити на сайті"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent transition-colors"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
          <Button variant="outline" size="icon" onClick={load} disabled={loading} className="h-9 w-9">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handlePreview} className="h-9 w-9">
            {preview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} size="sm" className="h-9">
            {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
            Зберегти
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="px-4 md:px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label>Заголовок сторінки</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Умови використання"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Контент</Label>
              <button
                type="button"
                onClick={handlePreview}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {preview ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {preview ? "Редагувати" : "Попередній перегляд"}
              </button>
            </div>

            {preview ? (
              <div
                className="prose prose-sm max-w-none min-h-[400px] rounded-xl border border-border bg-card p-4 md:p-8 text-foreground"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="rounded-xl border border-border bg-background min-h-[400px] overflow-hidden">
                <BlockNoteViewEditor editor={editor} theme="light" />
              </div>
            )}
          </div>

          <div className="pb-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="h-10 w-full sm:w-auto">
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Зберегти
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
