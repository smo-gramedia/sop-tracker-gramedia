// src/app/(admin)/glosarium/page.tsx  (replace existing)
import { prisma } from "@/lib/prisma";
import GlosariumClient from "@/components/admin/GlosariumClient";

export default async function GlosariumPage() {
  const entries = await prisma.glossaryEntry.findMany({ orderBy: { kata: "asc" } });
  return <GlosariumClient entries={entries}/>;
}
