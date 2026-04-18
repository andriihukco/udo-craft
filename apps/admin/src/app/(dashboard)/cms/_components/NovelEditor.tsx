"use client";

// Client-only — loaded via dynamic import (ssr: false) from BlockEditor.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorBubble,
  EditorBubbleItem,
  type EditorInstance,
  type JSONContent,
  StarterKit,
  Placeholder,
  GlobalDragHandle,
  TiptapLink,
  TiptapUnderline,
  HorizontalRule,
  TaskList,
  TaskItem,
  Command,
  createSuggestionItems,
  renderItems,
  handleCommandNavigation,
} from "novel";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
  Eye, Pencil, ExternalLink, CheckCircle2, Clock, AlertCircle,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  TextQuote, Code, Text, Minus,
  Bold, Italic, Underline, Strikethrough, Link, Code2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Extensions ────────────────────────────────────────────────────────────────

const extensions = [
  StarterKit.configure({
    bulletList: { HTMLAttributes: { class: "list-disc list-outside leading-6 ml-4" } },
    orderedList: { HTMLAttributes: { class: "list-decimal list-outside leading-6 ml-4" } },
    blockquote: { HTMLAttributes: { class: "border-l-4 border-primary pl-4 italic" } },
    codeBlock: { HTMLAttributes: { class: "rounded-md bg-muted text-muted-foreground border p-4 font-mono text-sm" } },
    code: { HTMLAttributes: { class: "rounded bg-muted px-1.5 py-0.5 font-mono text-sm" } },
    dropcursor: { color: "#DBEAFE", width: 3 },
    gapcursor: false,
    horizontalRule: false,
  }),
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === "heading"
        ? `Заголовок ${(node.attrs as { level: number }).level}`
        : "Натисніть / для команд або почніть писати…",
    includeChildren: true,
  }),
  GlobalDragHandle.configure({ dragHandleWidth: 24 }),
  TiptapLink.configure({
    HTMLAttributes: { class: "text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer" },
    openOnClick: false,
  }),
  TiptapUnderline,
  HorizontalRule.configure({ HTMLAttributes: { class: "my-4 border-t border-muted-foreground/30" } }),
  TaskList.configure({ HTMLAttributes: { class: "pl-2 not-prose" } }),
  TaskItem.configure({ HTMLAttributes: { class: "flex gap-2 items-start my-1" }, nested: true }),
  Command.configure({ suggestion: { items: () => suggestionItems, render: renderItems } }),
];

// ── Slash commands ────────────────────────────────────────────────────────────

const suggestionItems = createSuggestionItems([
  {
    title: "Текст",
    description: "Звичайний абзац.",
    searchTerms: ["p", "paragraph", "text"],
    icon: <Text size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run(),
  },
  {
    title: "Заголовок 1",
    description: "Великий заголовок секції.",
    searchTerms: ["h1", "heading", "title"],
    icon: <Heading1 size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Заголовок 2",
    description: "Середній заголовок.",
    searchTerms: ["h2", "heading"],
    icon: <Heading2 size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Заголовок 3",
    description: "Малий заголовок.",
    searchTerms: ["h3", "heading"],
    icon: <Heading3 size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Маркований список",
    description: "Список з крапками.",
    searchTerms: ["ul", "bullet", "list"],
    icon: <List size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Нумерований список",
    description: "Список з нумерацією.",
    searchTerms: ["ol", "ordered", "numbered"],
    icon: <ListOrdered size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Список завдань",
    description: "Список з чекбоксами.",
    searchTerms: ["todo", "task", "check"],
    icon: <CheckSquare size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Цитата",
    description: "Виділена цитата.",
    searchTerms: ["quote", "blockquote"],
    icon: <TextQuote size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Код",
    description: "Блок коду.",
    searchTerms: ["code", "codeblock", "pre"],
    icon: <Code size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Розділювач",
    description: "Горизонтальна лінія.",
    searchTerms: ["hr", "divider", "separator"],
    icon: <Minus size={16} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
]);

// ── Node type label helper ────────────────────────────────────────────────────

function getNodeLabel(editor: EditorInstance): string {
  if (editor.isActive("heading", { level: 1 })) return "Заголовок 1";
  if (editor.isActive("heading", { level: 2 })) return "Заголовок 2";
  if (editor.isActive("heading", { level: 3 })) return "Заголовок 3";
  if (editor.isActive("bulletList")) return "Список";
  if (editor.isActive("orderedList")) return "Нумерований";
  if (editor.isActive("taskList")) return "Завдання";
  if (editor.isActive("blockquote")) return "Цитата";
  if (editor.isActive("codeBlock")) return "Код";
  return "Текст";
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function NovelEditor({ slug, pageTitle, description, previewUrl }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [published, setPublished] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [initialContent, setInitialContent] = useState<JSONContent | null>(null);
  const [nodeTypeOpen, setNodeTypeOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const titleRef = useRef(title);
  const publishedRef = useRef(published);
  const editorRef = useRef<EditorInstance | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
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
          const json = data.content.body?.json;
          if (json) setInitialContent(json as JSONContent);
        }
        setSaveStatus("saved");
      } catch (e: unknown) {
        toast.error((e as Error).message || "Помилка завантаження");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const save = useCallback(async (currentTitle: string, currentPublished: boolean) => {
    if (!editorRef.current) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: pageTitle,
          body: {
            title: currentTitle,
            json: editorRef.current.getJSON(),
            html: editorRef.current.getHTML(),
          },
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
  }, [slug, pageTitle]);

  const scheduleSave = useDebouncedCallback((t: string, p: boolean) => {
    save(t, p);
  }, 1500);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    titleRef.current = val;
    setSaveStatus("unsaved");
    scheduleSave(val, publishedRef.current);
  };

  const handleEditorUpdate = ({ editor }: { editor: EditorInstance }) => {
    editorRef.current = editor;
    setSaveStatus("unsaved");
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 h-11 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
          <span className="truncate">CMS</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SaveIndicator status={saveStatus} updatedAt={updatedAt} />
          <div className="flex items-center rounded-full bg-muted p-0.5 gap-0.5" role="group">
            <button type="button" onClick={() => setMode("edit")} aria-pressed={isEdit}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isEdit ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Pencil className="size-3" />Редагувати
            </button>
            <button type="button" onClick={() => setMode("view")} aria-pressed={!isEdit}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!isEdit ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Eye className="size-3" />Перегляд
            </button>
          </div>
          <Button type="button" size="sm" variant={published ? "outline" : "default"}
            onClick={handlePublish} disabled={publishing} className="rounded-full text-xs h-7 px-3">
            {published ? "Зняти з публікації" : "Опублікувати"}
          </Button>
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="Відкрити на сайті">
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* View mode banner */}
      {!isEdit && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-700 font-medium">Режим перегляду — редагування вимкнено</p>
          <Button type="button" variant="link" size="sm" onClick={() => setMode("edit")}
            className="text-xs font-semibold text-amber-800 h-auto p-0">Редагувати</Button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="size-5 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />
        </div>
      ) : (
        <div className="px-6 md:px-20 py-10 max-w-3xl w-full mx-auto">

          {/* Meta row */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${published ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-muted text-muted-foreground ring-1 ring-border"}`}>
              <span className={`size-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              {published ? "Опубліковано" : "Чернетка"}
            </span>
            {updatedAt && <span className="text-xs text-muted-foreground">Змінено {timeAgo(updatedAt)}</span>}
            {description && <span className="text-xs text-muted-foreground truncate">{description}</span>}
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
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />

          <div className="border-t border-border mb-8" />

          {/* Novel editor */}
          <EditorRoot>
            <EditorContent
              initialContent={initialContent ?? undefined}
              extensions={extensions}
              editable={isEdit}
              onUpdate={handleEditorUpdate}
              onCreate={({ editor }) => { editorRef.current = editor; }}
              className="relative novel-editor-wrap"
              editorProps={{
                handleDOMEvents: {
                  keydown: (_view, event) => handleCommandNavigation(event),
                },
                attributes: {
                  class: "prose prose-zinc max-w-none focus:outline-none min-h-[300px] text-foreground [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_p]:leading-7 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5",
                },
              }}
            >
              {/* ── Slash command menu ── */}
              <EditorCommand className="z-50 h-auto max-h-72 overflow-y-auto rounded-xl border border-border bg-background shadow-xl py-1 w-64">
                <EditorCommandEmpty className="px-3 py-2 text-sm text-muted-foreground">Нічого не знайдено</EditorCommandEmpty>
                <EditorCommandList>
                  {suggestionItems.map((item) => (
                    <EditorCommandItem
                      key={item.title}
                      value={item.title}
                      onCommand={(val) => item.command?.(val)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors"
                    >
                      <span className="size-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground shrink-0">
                        {item.icon}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">{item.title}</span>
                        {item.description && <span className="text-[11px] text-muted-foreground truncate">{item.description}</span>}
                      </span>
                    </EditorCommandItem>
                  ))}
                </EditorCommandList>
              </EditorCommand>

              {/* ── Bubble menu (text selection toolbar) ── */}
              {isEdit && (
                <EditorBubble
                  tippyOptions={{ placement: "top", duration: 100 }}
                  className="flex items-center gap-0.5 rounded-lg border border-border bg-background shadow-lg px-1 py-1"
                >
                  {/* Node type selector */}
                  <div className="relative">
                    <EditorBubbleItem
                      onSelect={(editor) => setNodeTypeOpen((v) => !v)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
                    >
                      {editorRef.current ? getNodeLabel(editorRef.current) : "Текст"}
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </EditorBubbleItem>
                    {nodeTypeOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 w-44 rounded-xl border border-border bg-background shadow-xl py-1">
                        {[
                          { label: "Текст", action: (e: EditorInstance) => e.chain().focus().clearNodes().run() },
                          { label: "Заголовок 1", action: (e: EditorInstance) => e.chain().focus().setNode("heading", { level: 1 }).run() },
                          { label: "Заголовок 2", action: (e: EditorInstance) => e.chain().focus().setNode("heading", { level: 2 }).run() },
                          { label: "Заголовок 3", action: (e: EditorInstance) => e.chain().focus().setNode("heading", { level: 3 }).run() },
                          { label: "Маркований список", action: (e: EditorInstance) => e.chain().focus().toggleBulletList().run() },
                          { label: "Нумерований список", action: (e: EditorInstance) => e.chain().focus().toggleOrderedList().run() },
                          { label: "Цитата", action: (e: EditorInstance) => e.chain().focus().toggleBlockquote().run() },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (editorRef.current) item.action(editorRef.current);
                              setNodeTypeOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-px h-5 bg-border mx-0.5" />

                  {/* Bold */}
                  <EditorBubbleItem
                    onSelect={(editor) => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${editorRef.current?.isActive("bold") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    <Bold className="size-3.5" />
                  </EditorBubbleItem>

                  {/* Italic */}
                  <EditorBubbleItem
                    onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${editorRef.current?.isActive("italic") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    <Italic className="size-3.5" />
                  </EditorBubbleItem>

                  {/* Underline */}
                  <EditorBubbleItem
                    onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${editorRef.current?.isActive("underline") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    <Underline className="size-3.5" />
                  </EditorBubbleItem>

                  {/* Strikethrough */}
                  <EditorBubbleItem
                    onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${editorRef.current?.isActive("strike") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    <Strikethrough className="size-3.5" />
                  </EditorBubbleItem>

                  {/* Inline code */}
                  <EditorBubbleItem
                    onSelect={(editor) => editor.chain().focus().toggleCode().run()}
                    className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${editorRef.current?.isActive("code") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  >
                    <Code2 className="size-3.5" />
                  </EditorBubbleItem>

                  <div className="w-px h-5 bg-border mx-0.5" />

                  {/* Link */}
                  <div className="relative">
                    <EditorBubbleItem
                      onSelect={() => {
                        const url = editorRef.current?.getAttributes("link").href ?? "";
                        setLinkUrl(url);
                        setLinkOpen((v) => !v);
                      }}
                      className={`p-1.5 rounded hover:bg-muted transition-colors cursor-pointer ${editorRef.current?.isActive("link") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                    >
                      <Link className="size-3.5" />
                    </EditorBubbleItem>
                    {linkOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 w-72 rounded-xl border border-border bg-background shadow-xl p-2 flex gap-1.5">
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://..."
                          autoFocus
                          className="flex-1 text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (editorRef.current) {
                                if (linkUrl) {
                                  editorRef.current.chain().focus().setLink({ href: linkUrl }).run();
                                } else {
                                  editorRef.current.chain().focus().unsetLink().run();
                                }
                              }
                              setLinkOpen(false);
                            }
                            if (e.key === "Escape") setLinkOpen(false);
                          }}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (editorRef.current) {
                              if (linkUrl) {
                                editorRef.current.chain().focus().setLink({ href: linkUrl }).run();
                              } else {
                                editorRef.current.chain().focus().unsetLink().run();
                              }
                            }
                            setLinkOpen(false);
                          }}
                          className="px-2 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </EditorBubble>
              )}
            </EditorContent>
          </EditorRoot>
        </div>
      )}
    </div>
  );
}

// ── Save indicator ────────────────────────────────────────────────────────────

function SaveIndicator({ status, updatedAt }: { status: SaveStatus; updatedAt: string | null }) {
  if (status === "saving") return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="size-3 animate-pulse" />Збереження…
    </span>
  );
  if (status === "unsaved") return (
    <span className="flex items-center gap-1 text-xs text-amber-500">
      <AlertCircle className="size-3" />Не збережено
    </span>
  );
  if (status === "saved" && updatedAt) return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <CheckCircle2 className="size-3 text-emerald-500" />{timeAgo(updatedAt)}
    </span>
  );
  return null;
}
