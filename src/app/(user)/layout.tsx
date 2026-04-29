import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "user") redirect("/dashboard");
  return <>{children}</>;
}
