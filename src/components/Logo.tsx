// src/components/Logo.tsx
import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Tinggi logo dalam px. Width auto-scaled by Next/Image. */
  size?: number;
  /** Apakah menampilkan teks di samping logo. Default true. */
  withText?: boolean;
  /** Custom text di samping logo. Default: "Gramedia SOP System" */
  text?: string;
  /** Override href tujuan klik logo. Default: "/home" */
  href?: string;
  /** Kalau tidak ingin dibungkus Link, set ke true */
  asStatic?: boolean;
  /** ClassName untuk wrapper */
  className?: string;
  /** ClassName untuk teks */
  textClassName?: string;
};

export default function Logo({
  size = 28,
  withText = true,
  text = "Gramedia SOP Tracker",
  href = "/home",
  asStatic = false,
  className = "",
  textClassName = "",
}: Props) {
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo-g.png"
          alt="Gramedia"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {withText && (
      <span className={`font-display font-bold whitespace-nowrap leading-none ${textClassName}`}>
        {text}
      </span>
      )}
    </div>
  );

  if (asStatic) return content;

  return (
    <Link href={href} className="hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}
