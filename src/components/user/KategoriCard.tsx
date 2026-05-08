// src/components/user/KategoriCard.tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

type Props = {
  href: string;
  label: string;
  description: string;
  icon: string;
  count: number;
  bgClass: string; // bg-cat-sr | bg-cat-ss | etc
  iconAccent: string; // text-green-600 | text-blue-600 | etc
};

export default function KategoriCard({
  href,
  label,
  description,
  icon,
  count,
  bgClass,
  iconAccent,
}: Props) {
  return (
    <Link
      href={href}
      className={`group relative ${bgClass} rounded-2xl p-5 hover-lift overflow-hidden border border-white/40`}
    >
      {/* Decorative blob */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/30 blob-decoration opacity-50" />

      <div className="relative">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
          <Image
            src={icon}
            alt={label}
            width={32}
            height={32}
            className="object-contain"
          />
        </div>

        {/* Content */}
        <div className="font-display font-bold text-base mb-1 leading-tight">
          {label}
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed mb-4 line-clamp-2">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${iconAccent}`}>
            {count} dokumen
          </span>
          <span className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ArrowRight size={12} className="text-foreground" />
          </span>
        </div>
      </div>
    </Link>
  );
}
