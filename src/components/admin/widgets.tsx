"use client";

import { useRef, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

/**
 * Small interactive widgets used across admin detail pages.
 * Server-rendered forms + minimal client behavior (confirm / auto-submit).
 */

export function ConfirmButton({
  message,
  children,
  className,
}: {
  message: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className ?? "inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children ?? (
        <>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </>
      )}
    </button>
  );
}

/** Select that submits its enclosing form on change (progressively enhanced). */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  ariaLabel,
  action,
  hiddenInputs,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
  hiddenInputs: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="inline-flex">
      {Object.entries(hiddenInputs).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <select
        name={name}
        defaultValue={defaultValue}
        aria-label={ariaLabel}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm focus:border-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
