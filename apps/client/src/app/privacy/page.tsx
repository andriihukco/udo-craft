import { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Політика конфіденційності — U:DO CRAFT",
};

async function getContent() {
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("cms_content")
      .select("body")
      .eq("slug", "page_privacy")
      .single();
    return data?.body as { title?: string; content?: string } | null;
  } catch {
    return null;
  }
}

export default async function PrivacyPage() {
  const content = await getContent();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-8">
          {content?.title || "Політика конфіденційності"}
        </h1>
        {content?.content ? (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
            {content.content}
          </div>
        ) : (
          <p className="text-muted-foreground">Контент ще не додано.</p>
        )}
      </div>
    </main>
  );
}
