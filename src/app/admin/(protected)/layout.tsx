import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { can, type Permission } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const ALL_PERMISSIONS: Permission[] = [
  "inquiries.view", "inquiries.update", "inquiries.archive", "inquiries.delete", "inquiries.export",
  "content.manage", "content.delete",
  "analytics.view", "analytics.purge",
  "settings.manage", "team.manage",
];

/** Server-side authorization boundary for every protected admin page. */
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const settings = await getSettings();
  const permissions = ALL_PERMISSIONS.filter((permission) => can(user.role, permission));

  return (
    <AdminShell
      businessName={settings.name}
      userName={user.name}
      userRole={user.role}
      userAvatar={user.avatarUrl}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
