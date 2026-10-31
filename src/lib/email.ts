import { escapeHtml } from "@/lib/utils";

export type EmailStatus = "sent" | "failed" | "not_configured" | "partial";

interface InquiryEmailPayload {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  phone: string;
  practiceType: string;
  services: string[];
  claimVolume: string;
  preferredContact: string;
  message: string;
  businessName: string;
  notifyEmail: string;
}

/**
 * Send the new-inquiry notification to the business and a confirmation to
 * the submitter via Resend. Never throws: delivery problems are logged and
 * reported back as a status so a stored inquiry is never lost.
 */
export async function sendInquiryEmails(payload: InquiryEmailPayload): Promise<EmailStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("[email] RESEND_API_KEY or EMAIL_FROM not configured — skipping delivery, inquiry is stored.");
    return "not_configured";
  }

  type ResendClient = {
    emails: {
      send: (payload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        replyTo?: string;
      }) => Promise<unknown>;
    };
  };
  let resend: ResendClient;
  try {
    const mod = await import("resend");
    resend = new mod.Resend(apiKey) as unknown as ResendClient;
  } catch (error) {
    console.error("[email] provider init failed:", error instanceof Error ? error.message : "unknown");
    return "failed";
  }

  const e = escapeHtml;
  const brandName = e(payload.businessName);
  const servicesList = payload.services.length
    ? payload.services.map((s) => `<li>${e(s)}</li>`).join("")
    : "<li>Not specified</li>";

  const notifyHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;color:#0c1c33">
      <h2 style="color:#155bcf;margin:0 0 8px">New consultation inquiry</h2>
      <p style="margin:0 0 16px;color:#506480">Submitted through the ${brandName} website inquiry form.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Name</td><td><strong>${e(payload.fullName)}</strong></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Email</td><td>${e(payload.email)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Organization</td><td>${e(payload.organization) || "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Phone</td><td>${e(payload.phone) || "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Practice type</td><td>${e(payload.practiceType)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Claim volume</td><td>${e(payload.claimVolume) || "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#506480">Preferred contact</td><td>${e(payload.preferredContact)}</td></tr>
      </table>
      <h3 style="margin:20px 0 6px;font-size:14px;color:#506480">Services requested</h3>
      <ul style="margin:0;padding-left:20px;font-size:14px">${servicesList}</ul>
      <h3 style="margin:20px 0 6px;font-size:14px;color:#506480">Message</h3>
      <p style="font-size:14px;line-height:1.6;white-space:pre-wrap">${e(payload.message)}</p>
      <p style="margin-top:24px;font-size:12px;color:#8a99b5">Inquiry reference: ${e(payload.id)}</p>
    </div>`;

  const confirmHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;color:#0c1c33">
      <h2 style="color:#155bcf;margin:0 0 8px">We received your inquiry</h2>
      <p style="font-size:14px;line-height:1.6">Hello ${e(payload.fullName)},</p>
      <p style="font-size:14px;line-height:1.6">Thank you for contacting ${brandName}. Your consultation request has been received and will be reviewed shortly. You can expect a response at your preferred contact method within one to two business days.</p>
      <p style="font-size:14px;line-height:1.6;color:#506480">For reference: this inquiry concerned ${e(payload.practiceType)} services.</p>
      <p style="font-size:14px;line-height:1.6">Best regards,<br/>${brandName}</p>
      <p style="margin-top:24px;font-size:12px;color:#8a99b5">Inquiry reference: ${e(payload.id)}</p>
    </div>`;

  let failures = 0;
  try {
    await resend.emails.send({
      from,
      to: payload.notifyEmail || payload.email,
      replyTo: payload.email,
      subject: `New inquiry from ${payload.fullName} — ${payload.practiceType}`,
      html: notifyHtml,
    });
  } catch (error) {
    failures += 1;
    console.error("[email] notification failed:", error instanceof Error ? error.message : "unknown");
  }
  try {
    await resend.emails.send({
      from,
      to: payload.email,
      subject: `We received your inquiry — ${payload.businessName}`,
      html: confirmHtml,
    });
  } catch (error) {
    failures += 1;
    console.error("[email] confirmation failed:", error instanceof Error ? error.message : "unknown");
  }
  return failures === 0 ? "sent" : failures === 2 ? "failed" : "partial";
}

/** Send an admin password-recovery link. Returns whether it was delivered. */
export async function sendPasswordResetEmail(to: string, resetUrl: string, businessName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  try {
    const mod = await import("resend");
    const resend = new mod.Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `Administrator password reset — ${businessName}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:640px;color:#0c1c33">
        <h2 style="color:#155bcf">Password reset requested</h2>
        <p style="font-size:14px;line-height:1.6">A password reset was requested for an administrator account with this email address. The link expires in one hour.</p>
        <p style="font-size:14px;line-height:1.6"><a href="${escapeHtml(resetUrl)}" style="color:#155bcf">Reset your password</a></p>
        <p style="font-size:14px;line-height:1.6;color:#506480">If you did not request this, you can ignore this message — your password has not changed.</p>
      </div>`,
    });
    return true;
  } catch (error) {
    console.error("[email] reset email failed:", error instanceof Error ? error.message : "unknown");
    return false;
  }
}
