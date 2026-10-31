"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 8 MB before downscaling
const OUTPUT_SIZE = 256;

/**
 * Picks an image, downscales it to a square thumbnail in the browser, and
 * stores the result as a compact data URL in a hidden input. This keeps
 * profile pictures working without any external file-storage service.
 */
export function AvatarUpload({ initial, name = "avatarUrl" }: { initial: string | null; name?: string }) {
  const [preview, setPreview] = useState<string>(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That image is larger than 8 MB. Please choose a smaller file.");
      return;
    }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const side = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      // Center-crop to a square, then scale down.
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );
      bitmap.close?.();
      setPreview(canvas.toDataURL("image/jpeg", 0.82));
    } catch {
      setError("We couldn't read that image. Please try a different file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <input type="hidden" name={name} value={preview} />
      <span className="relative inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-subtle">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- user data URL, not a remote asset
          <img src={preview} alt="Your current profile picture preview" className="h-full w-full object-cover" />
        ) : (
          <ImageUp className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        )}
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-card/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </span>
        ) : null}
      </span>

      <div className="min-w-0">
        <input
          ref={inputRef}
          id="avatar-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-background-subtle"
          >
            {preview ? "Change picture" : "Upload picture"}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={() => {
                setPreview("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground shadow-sm transition-colors hover:border-red-400 hover:text-red-600"
            >
              Remove
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Square images work best. Pictures are resized to {OUTPUT_SIZE}×{OUTPUT_SIZE} in your browser and stored
          with your account — nothing is uploaded to a third-party service.
        </p>
        {error ? (
          <p role="alert" className="mt-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Small reusable avatar used in the sidebar and team table. */
export function AvatarBadge({
  name,
  avatarUrl,
  size = 36,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- stored data URL
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-xl object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary/15 font-display font-extrabold text-primary"
    >
      {initials}
    </span>
  );
}
