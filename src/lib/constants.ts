export const SOP_KATEGORI_LABEL: Record<string, string> = {
  sr: "SOP Operation",
  ss: "SOP Supporting Unit",
  sp: "SOP Publishing & Education",
  sg: "SOP General",
  petunjuk: "Petunjuk Pelaksanaan",
};

export const SOP_TIPE_LABEL: Record<string, string> = {
  MP: "Manual Prosedur",
  PS: "Panduan / Standar",
  IK: "Instruksi Kerja",
  petunjuk: "Petunjuk Pelaksanaan",
};

export const SOP_STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  draft: "Draft",
  obsolete: "Obsolete",
};

export const LEARNING_STEPS = [
  { id: 0, label: "Petunjuk Pembelajaran" },
  { id: 1, label: "Akses Dokumen" },
  { id: 2, label: "Baca Dokumen" },
  { id: 3, label: "Lampiran SOP" },
  { id: 4, label: "Upload Bukti Sosialisasi" },
  { id: 5, label: "Post Test" },
  { id: 6, label: "Selesai" },
] as const;

export const ADMIN_NAV = [
  { href: "/dashboard",                    label: "Dashboard",                 icon: "LayoutDashboard", role: ["admin","superadmin"] },
  { href: "/upload-dokumen",               label: "Upload Dokumen",             icon: "Upload",          role: ["superadmin"] },
  { href: "/raw-dokumen",                  label: "Raw Dokumen",                icon: "FileText",        role: ["admin","superadmin"] },
  { href: "/glosarium",                    label: "Glosarium",                  icon: "BookOpen",        role: ["admin","superadmin"] },
  { href: "/kategori",                     label: "Kategori SOP General",       icon: "Tag",             role: ["superadmin"] },
  { href: "/user-manajemen",               label: "User Manajemen",             icon: "Users",           role: ["superadmin"] },
  { href: "/struktur-organisasi/directorate", label: "Directorate",            icon: "Building",        role: ["superadmin"] },
  { href: "/struktur-organisasi/division", label: "Division",                   icon: "Building2",       role: ["superadmin"] },
  { href: "/struktur-organisasi/department","label": "Department",             icon: "Building",        role: ["superadmin"] },
  { href: "/attachment",                   label: "Attachment Sosialisasi SOP", icon: "Paperclip",       role: ["admin","superadmin"] },
  { href: "/user-progress",                label: "User Progress",              icon: "BarChart2",       role: ["admin","superadmin"] },
  { href: "/post-test",                    label: "Post Test",                  icon: "ClipboardList",   role: ["admin","superadmin"] },
  { href: "/faq",                          label: "FAQ",                        icon: "HelpCircle",      role: ["admin","superadmin"] },
] as const;

export const PASSING_GRADE_DEFAULT = 70;
export const POST_TEST_SOAL_COUNT  = 10;
export const UPLOAD_MAX_SIZE_KB    = 5120; // 5 MB
