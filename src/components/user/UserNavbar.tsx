// src/components/user/UserNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

type Props = {
  userName?: string | null;
  unreadCount?: number;
};

const SOP_CATEGORIES = [
  { href: "/sop/sr", label: "SOP Operation" },
  { href: "/sop/ss", label: "SOP Supporting Unit" },
  { href: "/sop/sp", label: "SOP Publishing & Education" },
  { href: "/sop/sg", label: "SOP General" },
] as const;

export default function UserNavbar({ userName, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const [sopOpen, setSopOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const sopRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sopRef.current && !sopRef.current.contains(e.target as Node)) {
        setSopOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSopOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  };

  // SOP dropdown active hanya untuk /sop/* (bukan /juklak)
  const isSopActive = pathname.startsWith("/sop/");

  return (
    <nav className="bg-background border-b sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size={38} textClassName="text-base" />

          <NavLink href="/home" active={isActive("/home")}>
            Home
          </NavLink>

          <NavLink href="/juklak" active={isActive("/juklak")}>
            Petunjuk Pelaksanaan
          </NavLink>

          {/* SOP Dropdown */}
          <div className="relative" ref={sopRef}>
            <button
              onClick={() => setSopOpen((v) => !v)}
              className={cn(
                "text-sm flex items-center gap-1 transition-colors relative",
                isSopActive
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-expanded={sopOpen}
              aria-haspopup="true"
            >
              SOP
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  sopOpen && "rotate-180"
                )}
              />
              {isSopActive && (
                <span className="absolute -bottom-[19px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>

            {sopOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border rounded-xl shadow-lg overflow-hidden">
                {SOP_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={cn(
                      "block px-4 py-2.5 text-sm transition-colors hover:bg-muted",
                      pathname === cat.href &&
                        "bg-primary/10 font-medium text-primary"
                    )}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifikasi"
            className="relative p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Notifikasi"
          >
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <Bell size={20} className="text-muted-foreground" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold hover:bg-primary/90 transition-colors"
              aria-label="Menu profil"
              aria-expanded={profileOpen}
            >
              {userName?.charAt(0).toUpperCase() ?? "?"}
            </button>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-background border rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <div className="text-sm font-medium truncate">
                    {userName ?? "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">Akun saya</div>
                </div>

                <div className="py-1">
                  <DropdownLink href="/profil" icon={User}>
                    Profil
                  </DropdownLink>
                  <DropdownLink href="/profil/settings" icon={Settings}>
                    Pengaturan
                  </DropdownLink>
                  <DropdownLink href="/bantuan" icon={HelpCircle}>
                    Bantuan
                  </DropdownLink>
                </div>

                <div className="py-1 border-t">
                  <button
                    onClick={() => signOut({ callbackUrl: "/sign-in" })}
                    className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2.5"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors relative",
        active
          ? "font-medium text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-[19px] left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2.5"
    >
      <Icon size={15} className="text-muted-foreground" />
      {children}
    </Link>
  );
}
