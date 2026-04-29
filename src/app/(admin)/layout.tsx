import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/sign-in");
  if (session.user.role === "user") redirect("/home");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role={session.user.role as "admin" | "superadmin"} />
      <main className="flex-1 bg-muted/30 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
