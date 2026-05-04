// src/app/(user)/profil/settings/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ProfilSettingsClient from "@/components/user/ProfilSettingsClient";

export default async function ProfilSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      kodeKaryawan: true,
      nama: true,
      email: true,
      unit: true,
      jabatan: true,
      section: true,
      role: true,
    },
  });

  if (!user) redirect("/profil");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft size={14} /> Kembali ke Profil
        </Link>
        <p className="text-sm text-muted-foreground">Pengaturan</p>
        <h1 className="font-display font-bold text-3xl mt-1">
          Pengaturan Akun
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Kelola informasi profil dan keamanan akun Anda.
        </p>
      </div>

      <ProfilSettingsClient user={user} />
    </div>
  );
}
