// src/components/user/UserFooter.tsx
import Link from "next/link";
import Logo from "@/components/Logo";

export default function UserFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size={42} textClassName="text-lg" className="mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Sistem pengelolaan dan pembelajaran SOP internal Kompas Gramedia.
              Pelajari, pahami, dan terapkan SOP dengan lebih terstruktur.
            </p>
          </div>

          {/* Help */}
          <div>
            <div className="font-display font-semibold text-sm mb-3">
              Bantuan
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/bantuan"
                  className="hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
               <li>
                <Link
                  href="https://sites.google.com/view/gramediagms/contact-us"
                  className="hover:text-primary transition-colors"
                >
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <div>© {year} Kompas Gramedia. All rights reserved.</div>
          <div>SOP Tracker · Internal Use Only</div>
        </div>
      </div>
    </footer>
  );
}
