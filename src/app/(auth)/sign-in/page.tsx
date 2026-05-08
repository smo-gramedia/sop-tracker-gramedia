"use client";

// src/app/(auth)/sign-in/page.tsx
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="font-display font-bold text-xl">
            Gramedia SOP Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sistem Pembelajaran SOP Internal
          </p>
        </div>

        {/* Form card */}
        <div className="bg-background rounded-2xl shadow-sm border p-7 space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg">Sign In</h2>
            <p className="text-muted-foreground text-xs mt-1">
              Gunakan email yang sudah diberikan oleh SMO
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@gramedia.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading}
            >
              {loading ? (
                "Memproses..."
              ) : (
                <>
                  <LogIn size={14} /> Masuk
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          Lupa password? Hubungi admin SMO Gramedia.
        </p>
      </div>
    </div>
  );
}
