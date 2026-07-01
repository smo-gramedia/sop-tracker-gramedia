// src/app/(admin)/loading.tsx
// E1: skeleton instan saat berpindah antar halaman admin.
// Muncul segera setelah klik (layout/sidebar tetap), konten menyusul —
// menghilangkan kesan "beku" saat server merender halaman dynamic.
export default function Loading() {
  return (
    <div className="p-6 md:p-8 animate-pulse">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="h-7 w-56 rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full rounded bg-muted/70" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-background p-5 space-y-3"
          >
            <div className="h-4 w-20 rounded bg-muted/70" />
            <div className="h-8 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="h-11 bg-muted/40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-t"
          >
            <div className="h-4 flex-1 rounded bg-muted/70" />
            <div className="h-4 w-24 rounded bg-muted/70" />
            <div className="h-4 w-20 rounded bg-muted/70" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
