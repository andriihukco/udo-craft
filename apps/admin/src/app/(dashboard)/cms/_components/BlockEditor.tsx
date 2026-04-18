"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const NovelEditor = dynamic(() => import("./NovelEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export interface BlockEditorProps {
  slug: string;
  pageTitle: string;
  description?: string;
  previewUrl?: string;
}

export function BlockEditor(props: BlockEditorProps) {
  return <NovelEditor {...props} />;
}
