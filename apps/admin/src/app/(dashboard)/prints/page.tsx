"use client";

import { useSearchParams } from "next/navigation";
import { ImageIcon, Layers, DollarSign } from "lucide-react";
import { DashboardPage } from "@/components/dashboard-page";
import PrintPresetsTab from "@/components/print-presets-tab";
import PrintTypesTab from "./_components/PrintTypesTab";
import PrintSizesTab from "./_components/PrintSizesTab";

type PrintsTab = "prints" | "types" | "sizes";

export default function PrintsPage() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") || "prints") as PrintsTab;

  return (
    <DashboardPage title="Принти">
      {tab === "prints" && <PrintPresetsTab />}
      {tab === "types" && <PrintTypesTab />}
      {tab === "sizes" && <PrintSizesTab />}
    </DashboardPage>
  );
}
