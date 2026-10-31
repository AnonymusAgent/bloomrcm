"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Accessibility,
  ALargeSmall,
  CaseSensitive,
  CircleOff,
  Contrast,
  Highlighter,
  Link2,
  MousePointer2,
  RotateCcw,
  Type,
  Underline,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface A11yPrefs {
  textScale: number;
  contrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  underlineLinks: boolean;
  enhancedFocus: boolean;
  readableFont: boolean;
  reduceMotion: boolean;
}

const DEFAULT_PREFS: A11yPrefs = {
  textScale: 100,
  contrast: false,
  grayscale: false,
  highlightLinks: false,
  underlineLinks: false,
  enhancedFocus: false,
  readableFont: false,
  reduceMotion: false,
};

const MODE_CLASSES: Record<Exclude<keyof A11yPrefs, "textScale">, string> = {
  contrast: "a11y-contrast",
  grayscale: "a11y-grayscale",
  highlightLinks: "a11y-highlight-links",
  underlineLinks: "a11y-underline-links",
  enhancedFocus: "a11y-focus",
  readableFont: "a11y-readable",
  reduceMotion: "a11y-reduce-motion",
};

const TEXT_STEPS = [90, 100, 110, 125, 150];

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;
  for (const [key, cls] of Object.entries(MODE_CLASSES)) {
    root.classList.toggle(cls, Boolean(prefs[key as keyof A11yPrefs]));
  }
  if (prefs.textScale !== 100) {
    root.style.fontSize = `${prefs.textScale}%`;
  } else {
    root.style.fontSize = "";
  }
  try {
    localStorage.setItem("ymbc-a11y", JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
}

export function A11yToolbar() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ymbc-a11y") ?? "{}") as Partial<A11yPrefs>;
      const merged = { ...DEFAULT_PREFS, ...stored };
      setPrefs(merged);
      applyPrefs(merged);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const update = useCallback((patch: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      return next;
    });
  }, []);

  const stepText = useCallback(
    (dir: 1 | -1) => {
      const idx = TEXT_STEPS.reduce(
        (best, step, i) => (Math.abs(step - prefs.textScale) < Math.abs(TEXT_STEPS[best] - prefs.textScale) ? i : best),
        1,
      );
      const next = TEXT_STEPS[Math.min(TEXT_STEPS.length - 1, Math.max(0, idx + dir))];
      update({ textScale: next });
    },
    [prefs.textScale, update],
  );

  const toggles: { key: Exclude<keyof A11yPrefs, "textScale">; label: string; description: string; icon: typeof Contrast }[] = [
    { key: "contrast", label: "High contrast", description: "Stronger text and border contrast", icon: Contrast },
    { key: "grayscale", label: "Grayscale", description: "Remove all color from the page", icon: CircleOff },
    { key: "highlightLinks", label: "Highlight links", description: "Give every link a clear background", icon: Highlighter },
    { key: "underlineLinks", label: "Underline links", description: "Underline links in content areas", icon: Underline },
    { key: "enhancedFocus", label: "Enhanced focus", description: "Stronger keyboard focus outlines", icon: MousePointer2 },
    { key: "readableFont", label: "Readable font", description: "Wider, high-legibility typeface", icon: CaseSensitive },
    { key: "reduceMotion", label: "Reduce animations", description: "Minimize motion and transitions", icon: Link2 },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Accessibility options"
        hidden={!open}
        className="mb-3 w-[21rem] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
            <Accessibility className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
            Accessibility options
          </h2>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
            aria-label="Close accessibility options"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background-subtle hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <fieldset className="mb-3 rounded-xl border border-border bg-background-subtle/60 p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Text size</legend>
          <div className="flex items-center gap-2" role="group" aria-label="Text size controls">
            <ToolbarButton onClick={() => stepText(-1)} label="Decrease text size" disabled={prefs.textScale <= TEXT_STEPS[0]}>
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums text-foreground" aria-live="polite">
              {prefs.textScale}%
            </span>
            <ToolbarButton onClick={() => stepText(1)} label="Increase text size" disabled={prefs.textScale >= TEXT_STEPS[TEXT_STEPS.length - 1]}>
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton onClick={() => update({ textScale: 100 })} label="Reset text size" disabled={prefs.textScale === 100}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
          </div>
        </fieldset>

        <ul className="max-h-72 space-y-1 overflow-y-auto pr-0.5" aria-label="Display options">
          {toggles.map(({ key, label, description, icon: IconCmp }) => {
            const active = Boolean(prefs[key]);
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ [key]: !active } as Partial<A11yPrefs>)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active ? "bg-accent-soft" : "hover:bg-background-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                    )}
                  >
                    <IconCmp className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">{label}</span>
                    <span className="block text-xs text-muted-foreground">{description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                      active ? "bg-primary" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                        active ? "left-[1.125rem]" : "left-0.5",
                      )}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => update(DEFAULT_PREFS)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background-subtle px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset all preferences
        </button>
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close accessibility options" : "Open accessibility options"}
        onClick={() => setOpen((v) => !v)}
        className="ml-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-navy text-white shadow-lg transition-transform hover:scale-105 dark:bg-primary dark:text-primary-foreground"
        style={{ height: 52, width: 52 }}
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="inline-flex h-9 w-9 flex-1 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
    >
      {children}
    </button>
  );
}
