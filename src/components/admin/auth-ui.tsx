/** Shared building blocks for standalone (unprotected) admin auth pages. */
"use client";

import { ThemeToggle } from "@/components/chrome";

export function ThemeToggleWrap() {
  return <ThemeToggle />;
}

export { Field, inputClass, LogoMark, Notice } from "@/components/ui";
