"use client";

// Client-only — loaded via dynamic import (ssr: false) from LandingSectionEditor.
import { useEffect, useState } from "react";
import { useCreateBlockNote, BlockNoteView } from "@blocknote/react";
import "@blocknote/react/style.css";
import { Label } from "@/components/ui/label";

interface RichFieldProps {
  label: string;
  value: unknown[];
  onChange: (blocks: unknown[]) => void;
}

export default function RichField({ label, value, onChange }: RichFieldProps) {
  const editor = useCreateBlockNote();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    if (Array.isArray(value) && value.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void editor.replaceBlocks(editor.document, value as any);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="rounded-lg border border-border bg-background min-h-[160px] overflow-hidden">
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => onChange(editor.document as unknown[])}
        />
      </div>
    </div>
  );
}
