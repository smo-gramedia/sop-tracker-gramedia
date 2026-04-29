import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");
  if (session.user.role === "user") redirect("/home");
  redirect("/dashboard");
}
