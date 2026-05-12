// src/app/(user)/profil/settings/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileSettingsForm from "@/components/user/ProfileSettingsForm";

export default async function ProfileSettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      nama: true,
      email: true,
      kodeUser: true,
      tipeUser: true,
      unit: true,
    },
  });

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Profil</p>
        <h1 className="font-display font-bold text-3xl mt-1">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi profil dan keamanan akun unit kerja Anda.
        </p>
      </div>

      <ProfileSettingsForm user={user} />
    </div>
  );
}
