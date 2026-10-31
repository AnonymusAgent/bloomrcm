/**
 * Centralized site configuration.
 *
 * Everything brand-related lives here: business name defaults, tagline,
 * contact details, practice types, lead pipeline configuration, the public
 * PHI notice, and editable draft legal content. The admin settings page can
 * override the identity fields at runtime (stored in the `business_settings`
 * database table); these defaults are the fallback and the seed values.
 *
 * To rebrand the whole site: update these defaults OR use /admin/settings.
 */

export const siteDefaults = {
  name: "Bloom RCM",
  shortName: "Bloom RCM",
  tagline: "Independent medical billing & revenue cycle support for US healthcare providers.",
  email: "bloomrcm@gmail.com",
  phone: "+92 (317) 935-6276",
  address: "Remote practice serving US healthcare providers",
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  logoUrl: null as string | null,
  notifyEmail: "", // falls back to `email` when empty
  socials: { linkedin: "", x: "" } as { linkedin?: string; x?: string },
  seo: {
    title: "Reliable Medical Billing & RCM Solutions for Healthcare Providers",
    description:
      "Practical revenue cycle support to help healthcare practices manage billing workflows, improve administrative efficiency, and focus more time on patient care.",
  },
  contactForm: { requireOrganization: true },
};

export const founderDefaults = {
  name: "Ali Mukhtar",
  headline: "Founder, Bloom RCM",
  bio: "I am Ali Mukhtar. I have spent my career in medical billing and revenue cycle work, mostly on the unglamorous side: eligibility checks, claim edits, payer follow-up, denial queues, and the reporting that tells you whether any of it is working. I worked inside billing teams at Bellmedex, RCM Matter, and 24-7 Consultancy, where I learned that most revenue problems are process problems long before they are people problems. Bloom RCM is my attempt to do the work the way I always wished it was done: documented, honest, and accountable. I am not a large call center, and I don't pretend to be. I take on a limited number of practices so I can actually know their accounts.",
};

export const PRACTICE_TYPES = [
  "Solo / individual provider practice",
  "Small group practice (2–10 providers)",
  "Multi-specialty group",
  "Behavioral health practice",
  "Physical / occupational therapy",
  "Dental or specialty practice",
  "Laboratory / diagnostic center",
  "Other healthcare organization",
] as const;

export const CLAIM_VOLUMES = [
  "Under 500 claims / month",
  "500 – 1,000 claims / month",
  "1,000 – 2,500 claims / month",
  "2,500 – 5,000 claims / month",
  "5,000+ claims / month",
  "Not sure yet",
] as const;

/** Lead pipeline statuses used across the admin dashboard. */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "converted",
  "closed",
  "spam",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  converted: "Converted",
  closed: "Closed",
  spam: "Spam",
};

export const PRIVACY_NOTICE_VERSION = "2026-01";

export const PRIVACY_NOTICE_TEXT =
  "Please do not include patient names, dates of birth, medical record numbers, insurance member IDs, diagnoses, clinical documents, or other protected health information in this form. Use this form for business inquiries only.";

/* ------------------------------------------------------------------ */
/* Draft legal content — REQUIRES LEGAL REVIEW BEFORE LAUNCH.          */
/* Edit here or move into the database later; keep the drafts visible. */
/* ------------------------------------------------------------------ */
export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalPage = {
  slug: "privacy" | "terms" | "accessibility";
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export const legalPages: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How business inquiry information is collected, used, and protected.",
    updated: "Draft — pending legal review",
    sections: [
      {
        heading: "1. Overview",
        paragraphs: [
          "This Privacy Policy explains what information this website collects when you contact the business, why it is collected, and how it is handled. It is a working draft prepared for a new independent medical billing and revenue cycle management business and must be reviewed by qualified legal counsel before public launch.",
        ],
      },
      {
        heading: "2. Information we collect",
        paragraphs: [
          "When you submit the consultation inquiry form, we collect the business contact details you provide: your name, work email address, organization name, phone number (optional), practice type, services of interest, estimated claim volume (optional), preferred contact method, and your message.",
          "The inquiry form is intended for business-to-business communication only. Please do not submit patient names, dates of birth, medical record numbers, insurance member IDs, diagnoses, clinical documents, or any other protected health information (PHI) through this website.",
        ],
      },
      {
        heading: "3. How information is used",
        paragraphs: [
          "Inquiry information is used solely to respond to your request, coordinate a consultation, manage the prospective-client relationship, and maintain internal records of our communication with you. Contact form submissions are not sold, rented, or shared with advertising networks or data brokers.",
        ],
      },
      {
        heading: "4. How information is stored and protected",
        paragraphs: [
          "Inquiries are stored in an access-controlled database reachable only by authorized administrators using authenticated sessions. Administrative actions on inquiries (status changes, notes, exports, deletions) are recorded in an internal audit log. Reasonable administrative and technical safeguards are applied; no method of transmission or storage is guaranteed to be 100% secure.",
        ],
      },
      {
        heading: "5. Retention and deletion",
        paragraphs: [
          "Inquiries are retained while the business relationship is active or being evaluated, and may be archived or deleted afterwards. You may request a copy, correction, or deletion of your inquiry information at any time by contacting the business email listed on the contact page.",
        ],
      },
      {
        heading: "6. Cookies and client-side preferences",
        paragraphs: [
          "This website stores functional preferences (theme choice and accessibility settings) in your browser's local storage. These preferences never leave your device. An authenticated session cookie is used only for the administrative area. This website does not send contact form content to third-party analytics or advertising tools.",
        ],
      },
      {
        heading: "7. Cookie categories and your choices",
        paragraphs: [
          "When you first visit, a cookie preference window asks what you allow. Cookies are grouped into three categories, and optional categories remain switched off until you turn them on.",
          "Strictly necessary cookies are always active and cannot be disabled, because the website cannot work correctly without them. They keep your administrator session secure, remember your light/dark theme and accessibility settings, protect forms against abuse, and store your cookie choice itself. They are never used for tracking or advertising.",
          "Analytics cookies are optional and off by default. When you allow them, we operate our own first-party measurement using our own database — we do not use Google Analytics, advertising pixels, data brokers, or any third-party tracking service, and we never track you across other websites. We record pages visited, visit time, whether the device is new or returning, the referring website, and general device and browser family. Cookie identifiers are stored only as salted one-way hashes, IP addresses are never stored, administrative pages are excluded, known bots are filtered, and nothing you type into a form is collected.",
          "Marketing and targeting cookies are optional and off by default. We do not currently set any advertising or remarketing cookies and no ad networks are integrated with this website. Your preference is recorded and will be honored if that ever changes.",
          "A cookie banner appears at the bottom of the page on your first visit and does not block your use of the website. If you continue browsing without making a selection, all cookie categories are accepted after a short countdown shown on the banner. You can change that decision at any time using the \"Cookie settings\" link in the website footer.",
          "If your browser sends a Do Not Track or Global Privacy Control signal, we treat it as a refusal of optional cookies: they are pre-set to off, and ignoring the banner keeps only strictly necessary cookies rather than accepting all. You may still switch optional categories on deliberately. Your preference is stored for 180 days.",
        ],
      },
      {
        heading: "8. Changes to this policy",
        paragraphs: [
          "This policy may be updated as the business and its legal review mature. Material changes will be reflected on this page with a revised effective date.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    description: "Terms governing use of this website and its inquiry workflow.",
    updated: "Draft — pending legal review",
    sections: [
      {
        heading: "1. Acceptance of terms",
        paragraphs: [
          "By using this website you agree to these Terms of Service. This is a working draft for a new business and requires review by qualified legal counsel before launch.",
        ],
      },
      {
        heading: "2. Informational purpose",
        paragraphs: [
          "Content on this website describes services the business offers or intends to offer and is provided for general informational purposes. It does not constitute legal, financial, coding, or compliance advice, and it does not create a client relationship. Service engagements are established only through a separately executed written agreement.",
        ],
      },
      {
        heading: "3. No outcome guarantees",
        paragraphs: [
          "Nothing on this website guarantees claim reimbursement, denial prevention, specific revenue outcomes, or payer behavior. Any statements about workflows or potential value describe typical administrative practices, not promised results.",
        ],
      },
      {
        heading: "4. Appropriate use of the inquiry form",
        paragraphs: [
          "You agree to provide accurate business contact information, to use the inquiry form only for legitimate business inquiries, and not to submit protected health information or unlawful content. Abuse, spam, or automated misuse may be rate-limited or blocked.",
        ],
      },
      {
        heading: "5. Intellectual property",
        paragraphs: [
          "The design, text, and original imagery of this website are the property of the business unless otherwise noted. You may not reproduce substantial portions without written permission.",
        ],
      },
      {
        heading: "6. Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, the business is not liable for indirect or consequential damages arising from use of this website. Final limitations will be established during legal review.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility Statement",
    description: "Our accessibility commitment, features, and feedback channel.",
    updated: "Draft — pending formal conformance review",
    sections: [
      {
        heading: "1. Our commitment",
        paragraphs: [
          "This website is designed with accessibility as a core requirement, aiming for WCAG 2.2 Level AA conformance. Accessibility work is ongoing; this statement describes intent and current measures, not a certified conformance claim. A formal audit is recommended before launch.",
        ],
      },
      {
        heading: "2. Measures taken",
        paragraphs: [
          "Semantic landmarks and logical heading structure across pages; full keyboard navigability with visible focus indicators; accessible forms with explicit labels, instructions, and error identification; a light/dark theme system that maintains readable contrast; reduced-motion support honoring operating system preferences; and careful color-contrast selections in both themes.",
        ],
      },
      {
        heading: "3. Built-in accessibility toolbar",
        paragraphs: [
          "An accessibility toolbar is available on every public page. It offers text enlargement and reduction, high-contrast mode, grayscale mode, link highlighting and underlining, enhanced keyboard focus, a readable-font mode, and reduced animations. Preferences persist across visits on the same device and can be reset at any time.",
        ],
      },
      {
        heading: "4. Known limitations",
        paragraphs: [
          "Accessibility is an ongoing effort, not a one-time checklist. New pages and features are reviewed against WCAG 2.2 AA as they are added, and older content is revisited when issues are reported. We do not claim perfect conformance; we do commit to fixing barriers promptly.",
        ],
      },
      {
        heading: "5. Feedback",
        paragraphs: [
          "If you encounter an accessibility barrier, please contact us using the business email on the contact page and describe the page and the problem. Accessibility feedback is treated as a priority.",
        ],
      },
    ],
  },
];
