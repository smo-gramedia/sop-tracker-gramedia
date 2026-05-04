"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/lib/constants";
import {
  LayoutDashboard, Upload, FileText, BookOpen, Tag,
  Users, Building, Building2, Paperclip, BarChart2,
  ClipboardList, HelpCircle, LogOut, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Upload, FileText, BookOpen, Tag,
  Users, Building, Building2, Paperclip, BarChart2,
  ClipboardList, HelpCircle,
};

type Props = { role: "admin" | "superadmin" };

export default function AdminSidebar({ role }: Props) {
  const pathname = usePathname();
  const [orgOpen, setOrgOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(true);

  const allowed = ADMIN_NAV.filter(item =>
    (item.role as readonly string[]).includes(role)
  );

  const docItems = allowed.filter(i =>
    ["/upload-dokumen","/raw-dokumen","/glosarium","/kategori"].includes(i.href)
  );
  const orgItems = allowed.filter(i =>
    i.href.includes("struktur-organisasi")
  );
  const otherItems = allowed.filter(i =>
    !docItems.includes(i) && !orgItems.includes(i) &&
    i.href !== "/dashboard"
  );
  const dashboard = allowed.find(i => i.href === "/dashboard");

  return (
    <aside className="w-64 min-h-screen bg-foreground text-background flex flex-col">
      {/* Header */}
  <div className="p-5 border-b border-background/10">
    <Link href="/dashboard" className="flex items-center gap-3 mb-4 hover:opacity-90 transition-opacity">
       <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
         <Image
           src="/logo-g.png"
           alt="Gramedia"
           width={36}
           height={36}
           className="object-contain"
           priority
         />
       </div>
       <span className="font-display font-bold text-lg leading-tight">
         Gramedia<br/>
         <span className="text-xs font-normal text-background/60">SOP System</span>
       </span>
     </Link>
          <span className="font-display font-bold text-lg">Gramedia</span>
        </div>
        <div className="text-xs uppercase tracking-wider text-background/40 mb-1">Workspace</div>
        <div className="font-semibold text-sm">{role === "superadmin" ? "Super Admin" : "Admin"} Panel</div>
        <div className="text-xs text-background/50 mt-0.5">Kelola SOP dan pantau progress</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Dashboard */}
        {dashboard && (
          <NavItem href="/dashboard" icon="LayoutDashboard" label="Dashboard" active={pathname === "/dashboard"} />
        )}

        {/* Manajemen Dokumen */}
        {docItems.length > 0 && (
          <div>
            <button
              onClick={() => setDocOpen(!docOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/70 hover:bg-background/10 transition-colors"
            >
              <FileText size={16} />
              <span className="flex-1 text-left font-medium">Manajemen Dokumen</span>
              <ChevronDown size={14} className={cn("transition-transform", docOpen && "rotate-180")} />
            </button>
            {docOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {docItems.map(item => (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname.startsWith(item.href)} child />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Other items */}
        {otherItems.map(item => (
          <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname.startsWith(item.href)} />
        ))}

        {/* Struktur Organisasi */}
        {orgItems.length > 0 && (
          <div>
            <button
              onClick={() => setOrgOpen(!orgOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/70 hover:bg-background/10 transition-colors"
            >
              <Building2 size={16} />
              <span className="flex-1 text-left font-medium">Struktur Organisasi</span>
              <ChevronDown size={14} className={cn("transition-transform", orgOpen && "rotate-180")} />
            </button>
            {orgOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {orgItems.map(item => (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname.startsWith(item.href)} child />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-background/10">
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-background/50 hover:text-background hover:bg-background/10 transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, child }: {
  href: string; icon: string; label: string; active: boolean; child?: boolean;
}) {
  const Icon = ICON_MAP[icon] ?? FileText;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
        child ? "text-background/60 hover:text-background hover:bg-background/10" : "text-background/70 hover:bg-background/10",
        active && "bg-background/15 text-background font-medium"
      )}
    >
      <Icon size={child ? 14 : 16} />
      {label}
    </Link>
  );
}
