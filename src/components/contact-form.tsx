"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import { contactSchema, type ContactFormValues, type ContactInput } from "@/lib/utils";
import { CLAIM_VOLUMES, PRACTICE_TYPES, PRIVACY_NOTICE_TEXT } from "@/config/site";
import { Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string; reference?: string; duplicate?: boolean }
  | { kind: "error"; message: string };

export function ContactForm({
  services,
  preselectedService,
  prefillMessage,
  requireOrganization,
}: {
  services: string[];
  preselectedService?: string;
  prefillMessage?: string;
  requireOrganization: boolean;
}) {
  const startedAt = useRef(Date.now());
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const serviceOptions = services.length > 0 ? services : [];

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      organization: "",
      phone: "",
      practiceType: "",
      services: preselectedService && serviceOptions.includes(preselectedService) ? [preselectedService] : [],
      claimVolume: "",
      preferredContact: "email",
      message: prefillMessage ?? "",
      privacyAck: false,
      company: "",
      startedAt: startedAt.current,
    },
  });

  const selectedServices = watch("services") ?? [];

  function toggleService(title: string) {
    const next = selectedServices.includes(title)
      ? selectedServices.filter((s) => s !== title)
      : [...selectedServices, title];
    setValue("services", next, { shouldValidate: true });
  }

  async function onSubmit(values: ContactInput) {
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startedAt: startedAt.current }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
        reference?: string;
        duplicate?: boolean;
        fieldErrors?: Record<string, string>;
      };

      if (res.ok && body.ok) {
        setState({ kind: "success", message: body.message ?? "Thank you — your inquiry has been received.", reference: body.reference, duplicate: body.duplicate });
        reset();
        startedAt.current = Date.now();
        return;
      }
      if (res.status === 422 && body.fieldErrors) {
        for (const [field, message] of Object.entries(body.fieldErrors)) {
          setError(field as keyof ContactInput, { type: "server", message });
        }
        setState({ kind: "error", message: body.error ?? "Please review the highlighted fields." });
        return;
      }
      setState({ kind: "error", message: body.error ?? "Something went wrong. Please try again." });
    } catch {
      setState({
        kind: "error",
        message: "We couldn't reach the server. Your inquiry has not been sent — please check your connection and try again.",
      });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 dark:border-emerald-900/60 dark:bg-emerald-950/40" role="status">
        <span className="inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-600 text-white dark:bg-emerald-700" style={{ height: 52, width: 52 }}>
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-emerald-950 dark:text-emerald-100">
          {state.duplicate ? "Already received" : "Inquiry received"}
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-emerald-900 dark:text-emerald-200">{state.message}</p>
        {state.reference ? (
          <p className="mt-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Reference: <span className="font-mono">{state.reference}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-600/40 px-4 py-2.5 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-100 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Submit another inquiry
        </button>
      </div>
    );
  }

  const submitting = state.kind === "submitting";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Consultation request form">
      <div aria-live="polite" aria-atomic="true">
        {state.kind === "error" ? (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            maxLength={120}
            className={inputClass}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
        </Field>

        <Field label="Work email" htmlFor="email" required error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </Field>

        <Field
          label="Practice or organization name"
          htmlFor="organization"
          required={requireOrganization}
          error={errors.organization?.message}
        >
          <input
            id="organization"
            type="text"
            autoComplete="organization"
            maxLength={160}
            className={inputClass}
            aria-invalid={Boolean(errors.organization)}
            aria-describedby={errors.organization ? "organization-error" : undefined}
            {...register("organization")}
          />
        </Field>

        <Field label="Phone number" htmlFor="phone" hint="Optional — include a country/area code if outside the US." error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={inputClass}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
            {...register("phone")}
          />
        </Field>

        <Field label="Provider or practice type" htmlFor="practiceType" required error={errors.practiceType?.message}>
          <select
            id="practiceType"
            className={inputClass}
            aria-invalid={Boolean(errors.practiceType)}
            aria-describedby={errors.practiceType ? "practiceType-error" : undefined}
            {...register("practiceType")}
          >
            <option value="">Select a practice type…</option>
            {PRACTICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estimated monthly claim volume" htmlFor="claimVolume" hint="Optional — an estimate is fine." error={errors.claimVolume?.message}>
          <select id="claimVolume" className={inputClass} {...register("claimVolume")}>
            <option value="">Prefer not to say / not sure</option>
            {CLAIM_VOLUMES.map((volume) => (
              <option key={volume} value={volume}>
                {volume}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold text-foreground">
          Services required <span className="font-normal text-muted-foreground">(select all that apply)</span>
        </legend>
        {errors.services?.message ? (
          <p role="alert" className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400">
            {errors.services.message}
          </p>
        ) : null}
        {serviceOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Service options will appear here once published.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2" role="list">
            {serviceOptions.map((title) => {
              const checked = selectedServices.includes(title);
              return (
                <li key={title}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                      checked
                        ? "border-primary bg-accent-soft/70 text-foreground dark:bg-accent-soft/25"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(title)}
                      className="h-4 w-4 rounded border-border accent-[#1552c4]"
                    />
                    {title}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold text-foreground">Preferred contact method</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preferred contact method">
          {(["email", "phone"] as const).map((method) => (
            <label
              key={method}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition-colors",
                watch("preferredContact") === method
                  ? "border-primary bg-accent-soft/70 text-foreground dark:bg-accent-soft/25"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <input type="radio" value={method} className="h-4 w-4 accent-[#1552c4]" {...register("preferredContact")} />
              {method === "email" ? "Email" : "Phone"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <Field
          label="How can we help?"
          htmlFor="message"
          required
          hint="Describe your practice, current billing setup, and what you'd like help with. Do not include any patient information."
          error={errors.message?.message}
        >
          <textarea
            id="message"
            rows={6}
            maxLength={4000}
            className={cn(inputClass, "resize-y leading-relaxed")}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : "message-hint"}
            {...register("message")}
          />
        </Field>
      </div>

      {/* Honeypot — invisible to humans, ignored by assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="company-website">Company website (leave blank)</label>
        <input id="company-website" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className="mt-7 rounded-xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/30">
        <p className="text-[13px] font-medium leading-relaxed text-amber-950 dark:text-amber-100">{PRIVACY_NOTICE_TEXT}</p>
        <label className="mt-3.5 flex cursor-pointer items-start gap-3 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-border accent-[#1552c4]"
            aria-invalid={Boolean(errors.privacyAck)}
            aria-describedby={errors.privacyAck ? "privacyAck-error" : undefined}
            {...register("privacyAck")}
          />
          <span>
            I have read and understand this notice, and I will not include protected health information in this form.
            <span className="ml-1 text-red-600 dark:text-red-400" aria-hidden="true">
              *
            </span>
          </span>
        </label>
        {errors.privacyAck?.message ? (
          <p id="privacyAck-error" role="alert" className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">
            {errors.privacyAck.message}
          </p>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          onClick={() => clearErrors()}
          className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong disabled:pointer-events-none disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4.5 w-4.5" aria-hidden="true" />
              Request a Consultation
            </>
          )}
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground" aria-live={submitting ? "polite" : "off"}>
          {submitting ? "Submitting securely, please wait…" : "Typical response time: one to two business days."}
        </p>
      </div>
    </form>
  );
}
