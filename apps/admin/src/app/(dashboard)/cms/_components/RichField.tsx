"use client";

// Client-only — loaded via dynamic import (ssr: false) from LandingSectionEditor.
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  type EditorInstance,
  type JSONContent,
  StarterKit,
  Placeholder,
  TiptapLink,
  TiptapUnderline,
  TaskList,
  TaskItem,
  Command,
  createSuggestionItems,
  renderItems,
  handleCommandNavigation,
} from "novel";
import { List, ListOrdered, Heading2, Heading3, TextQuote, Code, Text } from "lucide-react";
import { Label } from "@/components/ui/label";

const extensions = [
  StarterKit.configure({
    dropcursor: { color: "#DBEAFE", width: 3 },
    gapcursor: false,
  }),
  Placeholder.configure({ placeholder: "Введіть текст або / для команд…" }),
  TiptapLink.configure({ HTMLAttributes: { class: "text-primary underline underline-offset-2 cursor-pointer" } }),
  TiptapUnderline,
  TaskList,
  TaskItem.configure({ nested: true }),
  Command.configure({
    suggestion: {
      items: () => createSuggestionItems([
        { title: "Текст", searchTerms: ["p"], icon: <Text size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run() },
        { title: "Заголовок 2", searchTerms: ["h2"], icon: <Heading2 size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run() },
        { title: "Заголовок 3", searchTerms: ["h3"], icon: <Heading3 size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run() },
        { title: "Маркований список", searchTerms: ["ul", "bullet"], icon: <List size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
        { title: "Нумерований список", searchTerms: ["ol"], icon: <ListOrdered size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
        { title: "Цитата", searchTerms: ["quote"], icon: <TextQuote size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
        { title: "Код", searchTerms: ["code"], icon: <Code size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
      ]),
      render: renderItems,
    },
  }),
];

interface RichFieldProps {
  label: string;
  value: JSONContent | null;
  onChange: (json: JSONContent) => void;
}

export default function RichField({ label, value, onChange }: RichFieldProps) {
  const handleUpdate = ({ editor }: { editor: EditorInstance }) => {
    onChange(editor.getJSON());
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="rounded-lg border border-border bg-background min-h-[160px] overflow-hidden px-3 py-2">
        <EditorRoot>
          <EditorContent
            initialContent={value ?? undefined}
            extensions={extensions}
            onUpdate={handleUpdate}
            className="relative"
            editorProps={{
              handleDOMEvents: { keydown: (_view, event) => handleCommandNavigation(event) },
              attributes: { class: "prose prose-sm prose-zinc max-w-none focus:outline-none min-h-[120px] text-foreground" },
            }}
          >
            <EditorCommand className="z-50 h-auto max-h-60 overflow-y-auto rounded-xl border border-border bg-background shadow-xl py-1 w-56">
              <EditorCommandEmpty className="px-3 py-2 text-sm text-muted-foreground">Нічого не знайдено</EditorCommandEmpty>
              <EditorCommandList>
                {createSuggestionItems([
                  { title: "Текст", searchTerms: ["p"], icon: <Text size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run() },
                  { title: "Заголовок 2", searchTerms: ["h2"], icon: <Heading2 size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run() },
                  { title: "Маркований список", searchTerms: ["ul"], icon: <List size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
                  { title: "Цитата", searchTerms: ["quote"], icon: <TextQuote size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
                  { title: "Код", searchTerms: ["code"], icon: <Code size={14} />, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
                ]).map((item) => (
                  <EditorCommandItem
                    key={item.title}
                    value={item.title}
                    onCommand={(val) => item.command?.(val)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors"
                  >
                    <span className="size-6 flex items-center justify-center rounded border border-border bg-background text-muted-foreground shrink-0">{item.icon}</span>
                    <span className="font-medium text-foreground">{item.title}</span>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>
          </EditorContent>
        </EditorRoot>
      </div>
    </div>
  );
}
