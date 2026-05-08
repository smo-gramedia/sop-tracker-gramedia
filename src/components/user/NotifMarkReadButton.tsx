"use client";

// src/components/user/NotifMarkReadButton.tsx
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotifsAsRead } from "@/actions/notification-actions";

export default function NotifMarkReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await markAllNotifsAsRead();
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Gagal menandai");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      <CheckCheck size={14} />
      {isPending ? "Menandai..." : "Tandai Semua Sudah Dibaca"}
    </Button>
  );
}
