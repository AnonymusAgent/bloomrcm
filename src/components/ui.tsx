import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Compass,
  FileCheck2,
  HandCoins,
  IdCard,
  Inbox,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  SquareCode,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/config/site";

/* ------------------------------------------------------------------ */
/* Logo — Bloom RCM mark: a bloom of petals circling into a cycle,     */
/* merging the brand name with the revenue-cycle it manages.           */
/* ------------------------------------------------------------------ */
export function LogoMark({ className }: { className?: string }) {
  // Eight petals rotated around the center read as both a "bloom" and a cycle.
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} role="img" aria-hidden="true" fill="none">
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" className="fill-primary opacity-[0.10]" />
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" className="stroke-primary" strokeWidth="1.6" opacity="0.55" />
      {/* Dotted revenue-cycle ring */}
      <circle
        cx="20"
        cy="20"
        r="13.4"
        className="stroke-primary"
        strokeWidth="1.5"
        opacity="0.4"
        strokeLinecap="round"
        strokeDasharray="0.2 4.4"
      />
      {/* Bloom petals */}
      <g className="fill-primary">
        {petals.map((deg) => (
          <ellipse
            key={deg}
            cx="20"
            cy="12"
            rx="2.1"
            ry="3.6"
            transform={`rotate(${deg} 20 20)`}
            opacity={deg % 90 === 0 ? 1 : 0.78}
          />
        ))}
      </g>
      {/* Core */}
      <circle cx="20" cy="20" r="3.5" className="fill-accent" />
    </svg>
  );
}

export function Logo({ name, href = "/", compact = false }: { name: string; href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg font-display text-[15px] font-bold tracking-tight text-foreground",
        compact && "gap-2",
      )}
      aria-label={`${name} — home`}
    >
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      <span className="leading-tight">
        {name}
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Medical Billing &amp; RCM
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Icon registry for DB-driven service icons                           */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  FileCheck2,
  BadgeCheck,
  RefreshCcw,
  ShieldAlert,
  Receipt,
  HandCoins,
  Workflow,
  BarChart3,
  SquareCode,
  IdCard,
  Compass,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? FileCheck2;
  return <Icon className={className} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Icon registry for DB-driven specialty icons                         */
/* ------------------------------------------------------------------ */
import {
  Baby,
  Bone,
  Brain,
  ClipboardPlus,
  Dumbbell,
  FlaskConical,
  Hand,
  HeartPulse,
  Move,
  Scan,
  Smile,
  Sparkles,
  Speech,
  Stethoscope,
  Truck,
  Zap,
} from "lucide-react";

const specialtyIconMap: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  Stethoscope, ClipboardPlus, Brain, Baby, Dumbbell, Hand, Speech, HeartPulse, Bone, Sparkles,
  Zap, FlaskConical, Scan, Move, Smile, Truck,
};

export function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = specialtyIconMap[name] ?? Stethoscope;
  return <Icon className={className} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "btn bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong focus-visible:outline-ring",
  secondary:
    "btn border border-accent/30 bg-accent-soft font-bold text-foreground hover:border-accent/60 hover:bg-accent-soft/70",
  outline:
    "btn border border-border bg-card font-bold text-foreground shadow-sm hover:border-primary hover:bg-background-subtle hover:text-primary",
  ghost: "btn font-bold text-muted-foreground hover:bg-background-subtle hover:text-foreground",
  danger: "btn bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
};
const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function ButtonLink({
  href, children, variant = "primary", size = "md", className, ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & Record<string, unknown>) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  id?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]", className)}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notices, badges, empty states                                       */
/* ------------------------------------------------------------------ */
export function Notice({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  const isError = Boolean(error);
  const IconCmp = isError ? AlertTriangle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
        isError
          ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
          : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
      )}
    >
      <IconCmp className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      <p>{error ?? notice}</p>
    </div>
  );
}

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800",
  contacted: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800",
  qualified: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200 border-violet-300 dark:border-violet-800",
  proposal_sent: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800",
  converted: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
  closed: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
  spam: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800",
};

export function StatusBadge({ status, label }: { status: LeadStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusStyles[status] ?? statusStyles.new)}>
      {label}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-border bg-background-subtle px-3.5 py-1.5 text-sm font-medium text-foreground", className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-subtle/60 px-6 py-16 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Consultation CTA band                                               */
/* ------------------------------------------------------------------ */
export function CtaBand({
  title = "Ready to talk about your billing workflow?",
  description = "Request a consultation to discuss your practice, your systems, and where billing support would help most. We'll respond within one to two business days.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section aria-labelledby="cta-heading" className="relative overflow-hidden bg-navy">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(640px 260px at 12% 0%, rgba(21,82,196,.45), transparent 70%), radial-gradient(560px 240px at 88% 110%, rgba(11,143,133,.4), transparent 70%)",
        }}
      />
      <Container className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="cta-heading" className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-100/80 dark:text-slate-300">{description}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/contact" size="lg" className="bg-white text-navy hover:bg-blue-50">
              Request a Consultation
            </ButtonLink>
            <ButtonLink
              href="/services"
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:border-white/60 hover:text-white"
            >
              Explore Our Services
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */
export const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
        {required ? (
          <span className="ml-1 text-red-600 dark:text-red-400" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
