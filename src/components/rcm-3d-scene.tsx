"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  RefreshCcw,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  {
    label: "Eligibility checked",
    detail: "Coverage & benefits",
    icon: BadgeCheck,
    className: "left-[-0.35rem] top-[13%] sm:left-[-1.4rem]",
    depth: "translateZ(72px)",
  },
  {
    label: "Clean claim prepared",
    detail: "Reviewed before submission",
    icon: FileCheck2,
    className: "right-[-0.35rem] top-[34%] sm:right-[-1.7rem]",
    depth: "translateZ(100px)",
  },
  {
    label: "Follow-up documented",
    detail: "Every payer touch visible",
    icon: RefreshCcw,
    className: "bottom-[8%] left-[4%] sm:left-[-0.8rem]",
    depth: "translateZ(88px)",
  },
] as const;

export function Rcm3DScene({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches || document.documentElement.classList.contains("a11y-reduce-motion"));
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function moveScene(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === "touch") return;
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    scene.style.setProperty("--scene-rx", `${(-y * 7).toFixed(2)}deg`);
    scene.style.setProperty("--scene-ry", `${(x * 9).toFixed(2)}deg`);
    scene.style.setProperty("--scene-x", `${(x * 8).toFixed(2)}px`);
    scene.style.setProperty("--scene-y", `${(y * 8).toFixed(2)}px`);
  }

  function resetScene() {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty("--scene-rx", "0deg");
    scene.style.setProperty("--scene-ry", "0deg");
    scene.style.setProperty("--scene-x", "0px");
    scene.style.setProperty("--scene-y", "0px");
  }

  return (
    <figure
      className={cn("rcm-scene-shell relative mx-auto w-full max-w-[34rem]", className)}
      aria-label="A layered revenue cycle illustration showing eligibility, claim preparation, payer follow-up, and payment reconciliation"
      onPointerMove={moveScene}
      onPointerLeave={resetScene}
    >
      {/* Soft floor shadow makes the scene feel physically grounded. */}
      <div
        aria-hidden="true"
        className="absolute -bottom-7 left-[11%] h-16 w-[78%] rounded-[50%] bg-navy/20 blur-2xl dark:bg-black/50"
      />

      <div ref={sceneRef} className="rcm-scene relative aspect-[1.08/1]">
        {/* Back plate */}
        <div className="rcm-scene-back absolute inset-[4%] rounded-[2rem] border border-primary/15 bg-primary/10 dark:bg-primary/5" aria-hidden="true" />

        {/* Main visual plane */}
        <div className="rcm-scene-main absolute inset-[7%] overflow-hidden rounded-[1.75rem] border border-white/20 bg-navy shadow-2xl">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(45,212,191,0.30), transparent 45%), radial-gradient(circle at 75% 65%, rgba(59,130,246,0.38), transparent 50%), linear-gradient(160deg, #0b1f3a 0%, #102a4c 55%, #0a1a30 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/5 to-transparent"
          />

          {/* Connected cycle centerpiece */}
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-navy/75 px-4 py-3 text-white shadow-xl backdrop-blur-md">
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/15 text-teal-200">
                <Workflow className="h-5 w-5" aria-hidden="true" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-teal-300/25" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-extrabold">Revenue cycle, connected</span>
                <span className="block text-[11px] font-medium text-blue-100/75">Intake → Claim → Payment → Follow-up</span>
              </span>
            </div>
          </div>
        </div>

        {/* Orbital cycle rings — decorative but semantically tied to RCM. */}
        <div className="rcm-scene-ring rcm-scene-ring-one absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-teal-300/45" aria-hidden="true" />
        <div className="rcm-scene-ring rcm-scene-ring-two absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" aria-hidden="true" />

        {/* Workflow cards occupy distinct Z planes. */}
        {stages.map(({ label, detail, icon: Icon, className: position, depth }) => (
          <div
            key={label}
            className={cn(
              "rcm-scene-card absolute z-20 flex min-w-[11.5rem] items-center gap-2.5 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md",
              position,
            )}
            style={{ transform: depth }}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-sm">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-extrabold text-foreground">{label}</span>
              <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">{detail}</span>
            </span>
          </div>
        ))}

        {/* Payment endpoint gets a deeper floating badge without a fake amount. */}
        <div
          className="rcm-scene-payment absolute right-[4%] top-[7%] z-20 flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50/95 px-3 py-2 text-emerald-900 shadow-xl backdrop-blur dark:border-emerald-700/60 dark:bg-emerald-950/90 dark:text-emerald-100"
          style={{ transform: "translateZ(116px)" }}
        >
          <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
          <span className="text-[11px] font-extrabold">Payment reconciled</span>
        </div>

        <div
          className="rcm-scene-shield absolute bottom-[3%] right-[8%] z-20 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200/70 bg-blue-50/95 text-primary shadow-lg backdrop-blur dark:border-blue-800/60 dark:bg-blue-950/90"
          style={{ transform: "translateZ(64px)" }}
          aria-label="Confidential workflow handling"
        >
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <figcaption className="sr-only">
        Bloom RCM connects each administrative stage into a visible, documented revenue cycle workflow.
      </figcaption>
    </figure>
  );
}
