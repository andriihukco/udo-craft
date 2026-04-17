"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RefreshCw, Globe, Home, Info, Briefcase, Phone } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CmsBlock {
  slug: string;
  title: string;
  body: Record<string, string>;
  meta?: Record<string, string>;
}

// ── Page sections config ──────────────────────────────────────────────────────

const PAGE_SECTIONS = [
  {
    slug: "home_hero",
    label: "Головна — Hero",
    icon: Home,
    fields: [
      { key: "heading",    label: "Заголовок",    type: "input" },
      { key: "subheading", label: "Підзаголовок", type: "input" },
      { key: "cta_text",   label: "Кнопка CTA",   type: "input" },
      { key: "cta_url",    label: "Посилання CTA", type: "input" },
    ],
  },
  {
    slug: "home_about",
    label: "Головна — Про нас",
    icon: Info,
    fields: [
      { key: "heading", label: "Заголовок",  type: "input" },
      { key: "text",    label: "Текст",      type: "textarea" },
    ],
  },
  {
    slug: "home_services",
    label: "Головна — Послуги",
    icon: Briefcase,
    fields: [
      { key: "heading",  label: "Заголовок",    type: "input" },
      { key: "service1", label: "Послуга 1",    type: "input" },
      { key: "service2", label: "Послуга 2",    type: "input" },
      { key: "service3", label: "Послуга 3",    type: "input" },
      { key: "service4", label: "Послуга 4",    type: "input" },
    ],
  },
  {
    slug: "home_contact",
    label: "Головна — Контакти",
    icon: Phone,
    fields: [
      { key: "heading",  label: "Заголовок",  type: "input" },
      { key: "email",    label: "Email",      type: "input" },
      { key: "phone",    label: "Телефон",    type: "input" },
      { key: "address",  label: "Адреса",     type: "input" },
      { key: "telegram", label: "Telegram",   type: "input" },
      { key: "instagram",label: "Instagram",  type: "input" },
    ],
  },
  {
    slug: "seo_home",
    label: "SEO — Головна",
    icon: Globe,
    fields: [
      { key: "title",       label: "Meta Title",       type: "input" },
      { key: "description", label: "Meta Description", type: "textarea" },
      { key: "keywords",    label: "Keywords",         type: "input" },
    ],
  },
];

// ── Section Editor ────────────────────────────────────────────────────────────

function SectionEditor({
  section,
  data,
  onChange,
  onSave,
  saving,
}: {
  section: typeof PAGE_SECTIONS[0];
  data: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      {section.fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label>{f.label}</Label>
          {f.type === "textarea" ? (
            <Textarea
              rows={4}
              value={data[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="resize-none"
            />
          ) : (
            <Input
              value={data[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Зберегти
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CmsPagesPage() {
  const [blocks, setBlocks] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(PAGE_SECTIONS[0].slug);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const map: Record<string, Record<string, string>> = {};
      for (const item of (data.content as CmsBlock[])) {
        map[item.slug] = item.body ?? {};
      }
      setBlocks(map);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (slug: string, key: string, val: string) => {
    setBlocks((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] ?? {}), [key]: val },
    }));
  };

  const handleSave = async (slug: string) => {
    setSaving(slug);
    try {
      const section = PAGE_SECTIONS.find((s) => s.slug === slug);
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: section?.label ?? slug, body: blocks[slug] ?? {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Збережено");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Помилка");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">CMS — Сторінки</h1>
          <p className="text-sm text-muted-foreground">Редагуйте контент сайту без деплою</p>
        </div>
        <Button variant="outline" size="icon" onClick={load}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {PAGE_SECTIONS.map((s) => (
            <TabsTrigger key={s.slug} value={s.slug} className="gap-1.5">
              <s.icon className="size-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.label.split(" — ")[1] ?? s.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {PAGE_SECTIONS.map((s) => (
          <TabsContent key={s.slug} value={s.slug}>
            <div className="rounded-xl border border-border bg-card p-5 mt-4">
              <p className="text-sm font-semibold mb-4">{s.label}</p>
              <SectionEditor
                section={s}
                data={blocks[s.slug] ?? {}}
                onChange={(key, val) => handleChange(s.slug, key, val)}
                onSave={() => handleSave(s.slug)}
                saving={saving === s.slug}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
