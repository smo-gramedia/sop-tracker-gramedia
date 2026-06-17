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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import GlobalSearch from "@/components/user/GlobalSearch";

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
  // ─── NEW: Mobile menu state ────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);
  // Sub-menu mobile: SOP categories collapsible
  const [mobileSopOpen, setMobileSopOpen] = useState(false);

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

  // Auto-close semua menu saat pindah halaman
  useEffect(() => {
    setSopOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
    setMobileSopOpen(false);
  }, [pathname]);

  // ─── Body scroll lock saat mobile menu open ────────────────────
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  };

  // SOP dropdown active hanya untuk /sop/* (bukan /juklak)
  const isSopActive = pathname.startsWith("/sop/");

  return (
    <>
      <nav className="bg-background border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* ─── Left: Logo + Desktop Nav ─────────────────────────── */}
          <div className="flex items-center gap-6 min-w-0 flex-shrink">
            {/* Logo sudah punya <Link href="/home"> internal — jangan dibungkus Link lagi */}
            {/* Mobile: hanya icon (hide text), tablet+ : icon + text */}
            <div className="flex-shrink-0">
              <Logo
                size={38}
                textClassName="text-base hidden sm:inline-block"
              />
            </div>

            {/* Desktop nav links — hide di mobile */}
            <div className="hidden lg:flex items-center gap-6">
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
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background border rounded-xl shadow-lg overflow-hidden z-40">
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
          </div>

          {/* ─── Right: Search + Notif + Profile + Hamburger ───── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Global Search: desktop inline, mobile icon-modal */}
            <GlobalSearch />

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

            {/* Profile Dropdown — selalu tampil (desktop & mobile) */}
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
                <div className="absolute top-full right-0 mt-2 w-56 bg-background border rounded-xl shadow-lg overflow-hidden z-40">
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

            {/* ─── Hamburger button — HANYA mobile (< lg) ──── */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Buka menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={20} className="text-foreground" />
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════ */}
      {/* MOBILE MENU OVERLAY                                       */}
      {/* ════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer — slide from right */}
          <div className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-background shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Logo size={32} textClassName="text-sm" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Tutup menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-2">
              <MobileNavLink
                href="/home"
                active={isActive("/home")}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </MobileNavLink>
              <MobileNavLink
                href="/juklak"
                active={isActive("/juklak")}
                onClick={() => setMobileOpen(false)}
              >
                Petunjuk Pelaksanaan
              </MobileNavLink>

              {/* SOP Collapsible */}
              <button
                onClick={() => setMobileSopOpen((v) => !v)}
                className={cn(
                  "w-full px-5 py-3 text-sm flex items-center justify-between transition-colors hover:bg-muted",
                  isSopActive && "font-medium text-primary"
                )}
                aria-expanded={mobileSopOpen}
              >
                <span>SOP</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform",
                    mobileSopOpen && "rotate-180"
                  )}
                />
              </button>
              {mobileSopOpen && (
                <div className="bg-muted/30">
                  {SOP_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block pl-9 pr-5 py-2.5 text-sm transition-colors hover:bg-muted",
                        pathname === cat.href &&
                          "font-medium text-primary border-l-2 border-primary"
                      )}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="my-2 mx-5 border-t" />

              {/* Profile section di mobile */}
              <div className="px-5 py-2">
                <p className="text-xs uppercase text-muted-foreground font-medium mb-1">
                  Akun saya
                </p>
                <p className="text-sm font-medium truncate">
                  {userName ?? "User"}
                </p>
              </div>

              <MobileNavLink
                href="/profil"
                active={isActive("/profil") && pathname === "/profil"}
                onClick={() => setMobileOpen(false)}
                icon={User}
              >
                Profil
              </MobileNavLink>
              <MobileNavLink
                href="/profil/settings"
                active={isActive("/profil/settings")}
                onClick={() => setMobileOpen(false)}
                icon={Settings}
              >
                Pengaturan
              </MobileNavLink>
              <MobileNavLink
                href="/bantuan"
                active={isActive("/bantuan")}
                onClick={() => setMobileOpen(false)}
                icon={HelpCircle}
              >
                Bantuan
              </MobileNavLink>
            </div>

            {/* Footer logout */}
            <div className="border-t p-3">
              <button
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                className="w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2 rounded-lg border border-destructive/30"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Desktop NavLink ──────────────────────────────────────────────
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

// ─── Mobile Nav Link (full width row) ─────────────────────────────
function MobileNavLink({
  href,
  active,
  onClick,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "px-5 py-3 text-sm flex items-center gap-3 transition-colors hover:bg-muted",
        active && "font-medium text-primary bg-primary/5 border-l-2 border-primary"
      )}
    >
      {Icon && <Icon size={16} className="text-muted-foreground" />}
      <span>{children}</span>
    </Link>
  );
}

// ─── Dropdown Link (desktop profile menu) ─────────────────────────
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
