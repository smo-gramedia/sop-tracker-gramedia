// src/app/(admin)/attachment/page.tsx
import { getAttachments } from "@/actions/attachment";
import AttachmentClient from "@/components/admin/AttachmentClient";

export default async function AttachmentPage() {
  // Fetch ALL attachments (tanpa pagination, supaya filter di client jalan)
  const { data: attachments, total } = await getAttachments({ pageSize: 1000 });

  const menunggu = attachments.filter((a) => a.status === "menunggu").length;
  const disetujui = attachments.filter((a) => a.status === "disetujui").length;
  const ditolak = attachments.filter((a) => a.status === "ditolak").length;

  return (
    <AttachmentClient
      attachments={attachments as any}
      total={total}
      menunggu={menunggu}
      disetujui={disetujui}
      ditolak={ditolak}
    />
  );
}
