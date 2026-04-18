"use client";

// Client-only — loaded via dynamic import (ssr: false) from BlockEditor.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useCreateBlockNote,
  BlockNoteViewRaw,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import "@blocknote/react/style.css";
import { toast } from "sonner";
import { Eye, Pencil, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockNoteComponentsProvider } from "./BlockNoteComponents";

const ALLOWED_KEYS = new Set([
  "heading", "heading_2", "heading_3",
  "paragraph",
  "bullet_list", "numbered_list", "check_list",
  "quote", "divider", "table", "code_block",
]);

interface Props {
  slug: string;
  pageTitle: string;
  description?: string;
  previewUrl?: string;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "idle";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв тому`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год тому`;
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" }).format(new Date(iso));
}

export default function BlockNoteEditor({ slug, pageTitle, description, previewUrl }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [published, setPublished] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const publishedRef = useRef(published);

  const editor = useCreateBlockNote();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms?slug=${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.content) {
        const t = data.content.body?.title ?? "";
        setTitle(t);
        titleRef.current = t;
        const pub = data.content.published ?? false;
        setPublished(pub);
        publishedRef.current = pub;
        setUpdatedAt(data.content.updated_at ?? null);
        const blocks = data.content.body?.blocks;
        if (Array.isArray(blocks) && blocks.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await editor.replaceBlocks(editor.document, blocks as any);
        }
      }
      setSaveStatus("saved");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, [slug, editor]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (currentTitle: string, currentPublished: boolean) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: pageTitle,
          body: { title: currentTitle, blocks: editor.document },
          published: currentPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUpdatedAt(data.content?.updated_at ?? new Date().toISOString());
      setSaveStatus("saved");
    } catch (e: unknown) {
      setSaveStatus("unsaved");
      toast.error((e as Error).message || "Помилка збереження");
    }
  }, [slug, pageTitle, editor]);

  const scheduleSave = useCallback((t: string, p: boolean) => {
    setSaveStatus("unsaved");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(t, p), 1500);
  }, [save]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    titleRef.current = val;
    scheduleSave(val, publishedRef.current);
  };

  const handleEditorChange = () => {
    scheduleSave(titleRef.current, publishedRef.current);
  };

  const handlePublish = async () => {
    setPublishing(true);
    const next = !published;
    setPublished(next);
    publishedRef.current = next;
    await save(titleRef.current, next);
    setPublishing(false);
    toast.success(next ? "Сторінку опубліковано" : "Переведено в чернетку");
  };

  const isEdit = mode === "edit";

  return (
    <BlockNoteComponentsProvider>
      <div className="flex flex-col min-h-full bg-background">

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 h-11 flex items-center justify-between gap-4">

          {/* Left: breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
            <span className="truncate">CMS</span>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{pageTitle}</span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Save indicator */}
            <SaveIndicator status={saveStatus} updatedAt={updatedAt} />

            {/* Mode toggle */}
            <div className="flex items-center rounded-full bg-muted p-0.5 gap-0.5" role="group" aria-label="Режим редактора">
              <button
                type="button"
                onClick={() => setMode("edit")}
                aria-pressed={isEdit}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                  isEdit ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pencil className="size-3" aria-hidden="true" />
                Редагувати
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                aria-pressed={!isEdit}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                  !isEdit ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="size-3" aria-hidden="true" />
                Перегляд
              </button>
            </div>

            {/* Publish / Unpublish */}
            <Button
              type="button"
              size="sm"
              variant={published ? "outline" : "default"}
              onClick={handlePublish}
              disabled={publishing}
              aria-busy={publishing}
              className="rounded-full text-xs h-7 px-3"
            >
              {published ? "Зняти з публікації" : "Опублікувати"}
            </Button>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label="Відкрити на сайті"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* ── Status banner (view mode) ── */}
        {!isEdit && (
          <div role="status" aria-live="polite" className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-700 font-medium">Режим перегляду — редагування вимкнено</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setMode("edit")}
              className="text-xs font-semibold text-amber-800 h-auto p-0 focus-visible:ring-ring"
            >
              Редагувати
            </Button>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center flex-1 py-20">
            <div className="size-5 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />
          </div>
        ) : (
          <div className="px-6 md:px-20 py-10 max-w-3xl w-full mx-auto">

            {/* Meta row */}
            <div className="flex items-center gap-3 mb-6">
              {/* Published badge */}
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                published
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-muted text-muted-foreground ring-1 ring-border"
              }`}>
                <span className={`size-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-muted-foreground"}`} aria-hidden="true" />
                {published ? "Опубліковано" : "Чернетка"}
              </span>

              {updatedAt && (
                <span className="text-xs text-muted-foreground">
                  Змінено {timeAgo(updatedAt)}
                </span>
              )}

              {description && (
                <span className="text-xs text-muted-foreground truncate">{description}</span>
              )}
            </div>

            {/* Title */}
            <textarea
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Без назви"
              rows={1}
              readOnly={!isEdit}
              aria-label="Заголовок сторінки"
              className={`w-full resize-none bg-transparent text-4xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:outline-none mb-4 leading-tight ${!isEdit ? "cursor-default pointer-events-none" : ""}`}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }}
            />

            {/* Divider */}
            <div className="border-t border-border mb-8" />

            {/* Editor */}
            <div className={`bn-notion-wrap ${!isEdit ? "bn-view-mode" : ""}`}>
              <BlockNoteViewRaw
                editor={editor}
                theme="light"
                editable={isEdit}
                onChange={handleEditorChange}
              >
                {isEdit && (
                  <SuggestionMenuController
                    triggerCharacter="/"
                    getItems={async (query) =>
                      getDefaultReactSlashMenuItems(editor)
                        .filter((item) => ALLOWED_KEYS.has((item as { key?: string }).key ?? ""))
                        .filter((item) =>
                          !query ||
                          item.title.toLowerCase().includes(query.toLowerCase()) ||
                          item.aliases?.some((a) => a.toLowerCase().includes(query.toLowerCase()))
                        )
                    }
                  />
                )}
              </BlockNoteViewRaw>
            </div>
          </div>
        )}
      </div>
    </BlockNoteComponentsProvider>
  );
}

// ── Save indicator ────────────────────────────────────────────────────────────

function SaveIndicator({ status, updatedAt }: { status: SaveStatus; updatedAt: string | null }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3 animate-pulse" aria-hidden="true" />
        Збереження…
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-500">
        <AlertCircle className="size-3" aria-hidden="true" />
        Не збережено
      </span>
    );
  }
  if (status === "saved" && updatedAt) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
        {timeAgo(updatedAt)}
      </span>
    );
  }
  return null;
}
