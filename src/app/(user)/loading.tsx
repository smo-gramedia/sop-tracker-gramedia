// src/app/(user)/loading.tsx
// E1: skeleton instan saat berpindah antar halaman user.
// Muncul segera setelah klik (navbar tetap), konten menyusul.
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
      {/* Hero */}
      <div className="rounded-2xl border bg-background p-8 mb-6 space-y-3">
        <div className="h-8 w-64 max-w-full rounded-md bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted/70" />
        <div className="h-9 w-40 rounded-lg bg-muted mt-4" />
      </div>

      {/* Grid kartu */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-background p-5 space-y-3"
          >
            <div className="h-5 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted/60" />
            <div className="h-3 w-2/3 rounded bg-muted/60" />
            <div className="h-2 w-full rounded bg-muted/40 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
