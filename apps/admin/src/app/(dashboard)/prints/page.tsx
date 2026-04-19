"use client";

import { useSearchParams } from "next/navigation";
import { ImageIcon, Layers, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import PrintPresetsTab from "@/components/print-presets-tab";
import PrintTypesTab from "./_components/PrintTypesTab";
import PrintSizesTab from "./_components/PrintSizesTab";

type PrintsTab = "prints" | "types" | "sizes";

const TABS: { key: PrintsTab; icon: React.ElementType; label: string }[] = [
  { key: "prints", icon: ImageIcon,  label: "Принти" },
  { key: "types",  icon: DollarSign, label: "Типи друку" },
  { key: "sizes",  icon: Layers,     label: "Розміри друку" },
];

export default function PrintsPage() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") || "prints") as PrintsTab;

  return (
    <div className="flex flex-1 h-0 flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <PageHeader title="Принти" />
      </div>

      <div className="h-10 px-4 border-b border-border shrink-0 flex items-center gap-1">
        <nav className="flex h-full">
          {TABS.map(({ key, icon: Icon, label }) => (
            <a
              key={key}
              href={`/prints?tab=${key}`}
              className={`flex items-center gap-1.5 px-3 h-full text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                tab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "prints" && <PrintPresetsTab />}
        {tab === "types" && <PrintTypesTab />}
        {tab === "sizes" && <PrintSizesTab />}
      </div>
    </div>
  );
}
