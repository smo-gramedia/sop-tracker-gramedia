"use client";

// src/components/admin/StrukturOrgTabs.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Layers, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/struktur-organisasi/directorate",
    label: "Directorate",
    icon: Building2,
    description: "Direktorat / Anak perusahaan",
  },
  {
    href: "/struktur-organisasi/division",
    label: "Division",
    icon: Network,
    description: "Divisi di bawah direktorat",
  },
  {
    href: "/struktur-organisasi/department",
    label: "Department",
    icon: Layers,
    description: "Departemen di bawah divisi",
  },
];

export default function StrukturOrgTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b mb-6">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
