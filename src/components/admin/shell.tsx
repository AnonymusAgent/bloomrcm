"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ChartColumnBig,
  FileQuestion,
  Inbox,
  Layers,
  LogOut,
  Menu,
  Settings2,
  SquareActivity,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui";
import { ThemeToggle } from "@/components/chrome";
import { AvatarBadge } from "@/components/admin/avatar-upload";
import { IdleTimeout } from "@/components/admin/idle-timeout";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABELS, toRole, type Permission } from "@/lib/roles";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Inbox;
  exact?: boolean;
  permission?: Permission;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: SquareActivity, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: ChartColumnBig, permission: "analytics.view" },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, permission: "inquiries.view" },
  { href: "/admin/services", label: "Services", icon: Layers, permission: "content.manage" },
  { href: "/admin/specialties", label: "Specialties", icon: Stethoscope, permission: "content.manage" },
  { href: "/admin/experience", label: "Experience", icon: BriefcaseBusiness, permission: "content.manage" },
  { href: "/admin/faqs", label: "FAQs", icon: FileQuestion, permission: "content.manage" },
  { href: "/admin/team", label: "Team & roles", icon: UsersRound, permission: "team.manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings2, permission: "settings.manage" },
  { href: "/admin/profile", label: "My profile", icon: UserRound },
];

export function AdminShell({
  children,
  businessName,
  userName,
  userRole,
  userAvatar,
  permissions,
}: {
  children: ReactNode;
  businessName: string;
  userName: string;
  userRole: string;
  userAvatar?: string | null;
  permissions: Permission[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  // Only show destinations this role can actually open.
  const visibleNav = NAV.filter((item) => !item.permission || permissions.includes(item.permission));

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-4 py-6">
      <ul className="space-y-1">
        {visibleNav.map(({ href, label, icon: IconCmp, exact }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href, exact) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active(href, exact)
                  ? "bg-white/12 text-white"
                  : "text-blue-100/70 hover:bg-white/8 hover:text-white",
              )}
              style={active(href, exact) ? { backgroundColor: "rgba(255,255,255,0.14)" } : undefined}
            >
              <IconCmp className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background-subtle/60">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex" style={{ backgroundColor: "var(--navy)" }}>
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <LogoMark className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-white">{businessName}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-100/60">Admin console</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5 px-1">
            <Link href="/admin/profile" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 hover:bg-white/10">
              <AvatarBadge name={userName} avatarUrl={userAvatar} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">{userName}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-blue-100/60">
                  {ROLE_LABELS[toRole(userRole)]}
                </span>
              </span>
            </Link>
            <ThemeToggle className="border-white/15 bg-white/5 text-blue-100/80 hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden"
        style={{ backgroundColor: "var(--navy)" }}
      >
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <p className="font-display text-sm font-bold text-white">Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="border-white/15 bg-white/5 text-blue-100/80 hover:text-white" />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
            aria-label={open ? "Close admin menu" : "Open admin menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-over nav */}
      <div
        id="admin-mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-[60px] bottom-0 z-40 flex flex-col lg:hidden"
        style={{ backgroundColor: "var(--navy)" }}
      >
        {nav}
        <div className="border-t border-white/10 px-5 py-4 text-blue-100/70">
          <p className="text-sm font-bold text-white">{userName}</p>
          <p className="text-xs uppercase tracking-wider">{userRole}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col pt-[60px] lg:pl-64 lg:pt-0">
        <div className="flex items-center justify-end border-b border-border bg-background px-5 py-2.5 sm:px-8">
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-background-subtle hover:text-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
        <main id="main" className="flex-1 px-5 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <IdleTimeout />
      </div>
    </div>
  );
}
