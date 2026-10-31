-- Seed data for the medical billing & RCM business website.
-- Idempotent: safe to run multiple times. Content describes real service
-- offerings and professional background only — no fabricated metrics,
-- testimonials, certifications, or endorsements.

BEGIN;

-- ---------------------------------------------------------------------
-- Business settings (single-row)
-- ---------------------------------------------------------------------
INSERT INTO business_settings (id, business_name, tagline, email, phone, address, website_url, notify_email, socials, seo, contact_form)
VALUES (
  1,
  'Bloom RCM',
  'Independent medical billing & revenue cycle support for US healthcare providers.',
  'bloomrcm@gmail.com',
  '+92 (317) 935-6276',
  'Remote practice serving US healthcare providers',
  'http://localhost:3000',
  'bloomrcm@gmail.com',
  '{"linkedin":"","x":""}'::jsonb,
  '{"title":"Reliable Medical Billing & RCM Solutions for Healthcare Providers","description":"Practical revenue cycle support to help healthcare practices manage billing workflows, improve administrative efficiency, and focus more time on patient care."}'::jsonb,
  '{"requireOrganization":true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Site content: homepage + about page editable copy
-- ---------------------------------------------------------------------
INSERT INTO site_content (key, content) VALUES
('home', '{
  "heroEyebrow": "Independent RCM Partner",
  "heroHeading": "Reliable Medical Billing & RCM Solutions for Healthcare Providers",
  "heroSubheading": "Practical revenue cycle support to help healthcare practices manage billing workflows, improve administrative efficiency, and focus more time on patient care.",
  "introHeading": "A focused billing partner for independent practices",
  "introBody": "Bloom RCM is an independent medical billing and revenue cycle management practice serving US healthcare providers. The work is documentation-led and workflow-first: eligibility, claims, payment posting, follow-up, and reporting handled with consistency, clear communication, and respect for confidentiality.",
  "specialties": ["Solo & small group practices","Behavioral health","Physical & occupational therapy","Primary care","Multi-specialty groups","Laboratory & diagnostics","Other outpatient specialties"],
  "whyUs": ["Workflow-first approach: documented processes instead of ad-hoc billing","Clear, scheduled communication — you always know what is being worked on","Accuracy and confidentiality treated as operating requirements, not slogans","Flexible engagement scopes shaped around your practice systems","Transparent reporting so billing activity stays visible to you"]
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, content) VALUES
('about', '{
  "mission": "Medical billing shouldn''t be a black box. My job is to make sure every claim gets worked, every denial has a reason, and you can see where your revenue stands without chasing anyone for an answer.",
  "values": ["Tell the truth, even when the numbers are bad","Fix the process, not just the claim","Document the work so nothing depends on memory","Answer questions in plain English","Treat every practice''s data like it matters, because it does","Leave things better than we found them"],
  "founderName": "Ali Mukhtar",
  "founderHeadline": "Founder, Bloom RCM",
  "founderBio": "I am Ali Mukhtar. I have spent my career in medical billing and revenue cycle work, mostly on the unglamorous side: eligibility checks, claim edits, payer follow-up, denial queues, and the reporting that tells you whether any of it is working. I worked inside billing teams at Bellmedex, RCM Matter, and 24-7 Consultancy, where I learned that most revenue problems are process problems long before they are people problems. Bloom RCM is my attempt to do the work the way I always wished it was done: documented, honest, and accountable. I am not a large call center, and I don''t pretend to be. I take on a limited number of practices so I can actually know their accounts.",
  "approach": "I start by learning how your practice actually runs, not how a template says it should. That means looking at your practice management system, your top payers, your front desk handoffs, and the queues nobody has time to work. From there we agree on what is in scope, what gets reported, and who does what. No vague promises. You should always be able to point to a document that says what we handle and a report that shows what we did.",
  "onboarding": "The first couple of weeks are about getting the details right. We meet, review your workflow and systems, and put the scope in writing before anything moves. Access gets set up only after the paperwork is signed. Then we run in parallel for a while so you can compare our work against your existing process before making a full switch. If something isn''t working, we fix it during that window instead of discovering it three months later."
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------
INSERT INTO services (title, slug, summary, description, workflow, value, requirements, icon, display_order) VALUES
('Medical Billing & Claims Submission','medical-billing-claims-submission',
 'Accurate preparation and submission of professional claims to payers and clearinghouses.',
 'End-to-end handling of routine claim lifecycles: charge capture review, claim preparation, scrubbing against basic edits, electronic submission through the appropriate clearinghouse, and confirmation of payer acceptance. The workflow is documented per practice so every claim follows the same checks.',
 'Charge and coding review against documented practice workflow\nClaim preparation and basic scrub edits\nElectronic submission via clearinghouse\nPayer acceptance confirmation and tracking log\nExceptions flagged and communicated the same week',
 'A consistent, predictable submission process reduces avoidable rejections from missing or inconsistent claim data and keeps claim status visible to the practice.',
 'Timely access to encounter and charge data in your practice management system; agreed payer list; designated practice contact for escalation.',
 'FileCheck2', 1),
('Eligibility & Benefits Verification','eligibility-benefits-verification',
 'Upfront insurance eligibility and benefits checks before or at the point of service.',
 'Structured verification of patient coverage details — plan status, effective dates, copay and deductible information, referral or authorization flags where applicable — recorded into your practice management system in an agreed format and timeframe.',
 'Receive scheduled patient list or new-patient intake\nVerify coverage and benefit details with payer portals or phone\nRecord verification results into your PM system\nFlag exceptions (inactive coverage, authorization needs) to front desk\nWeekly summary of verification activity',
 'Verifying coverage before service helps practices set accurate expectations with patients and reduces downstream rework from eligibility-related denials.',
 'Access to your scheduling or intake data; agreed turnaround time; payer portal access or provider-relations contacts where needed.',
 'BadgeCheck', 2),
('Insurance Claim Follow-Up','insurance-claim-follow-up',
 'Systematic tracking and follow-up on submitted claims until resolution.',
 'Claim status monitoring across payer portals and clearinghouse reports, with scheduled follow-up on pending, rejected, or in-process claims. Each touch is logged so the practice can see exactly what has been done on every claim in the work queue.',
 'Aging and status report generation from PM and clearinghouse data\nPrioritized follow-up queue by age and balance\nPayer contact and status documentation\nEscalation of payer issues to practice with options\nFollow-up log updated continuously',
 'Consistent follow-up prevents claims from quietly aging past timely-filing or appeal windows, and turns "unknown status" into a visible, managed queue.',
 'Current PM and clearinghouse access; agreed follow-up cadence; payer contact reference sheet for your top payers.',
 'RefreshCcw', 3),
('Denial Management & Appeals Support','denial-management-appeals-support',
 'Organized denial review, categorization, and appeal preparation support.',
 'Denials are categorized by root cause (eligibility, coding, authorization, timely filing, documentation), worked in priority order, and tracked to resolution. Where an appeal is appropriate, supporting documentation packages are prepared for practice review and submission according to your policies.',
 'Denial report intake and categorization by reason code\nRoot-cause grouping to spot recurring issues\nCorrective workflow for fixable denials\nAppeal packet preparation for practice approval\nTrend summary shared with practice leadership',
 'Categorizing denials by root cause helps practices fix the process issues behind them — not just rework individual claims.',
 'Denial and remittance data access; practice-approved appeal policy; clinical documentation access where payer requests require it.',
 'ShieldAlert', 4),
('Payment Posting & Reconciliation','payment-posting-reconciliation',
 'Accurate posting of ERA/EOB payments with deposit-level reconciliation.',
 'Posting of insurance and patient payments, adjustments, and denials into your practice management system, with reconciliation of ERAs against deposits and expected amounts. Discrepancies are flagged rather than absorbed silently.',
 'ERA/EOB intake and posting to correct encounters\nContractual adjustment application per fee schedule\nDeposit-to-remit reconciliation\nDiscrepancy and variance flagging\nMonthly posting summary for practice review',
 'Clean posting is the foundation of trustworthy A/R: every downstream report, follow-up queue, and patient statement depends on it being right.',
 'Read/post access to your PM system; remittance and deposit data; your approved adjustment and write-off policy.',
 'Receipt', 5),
('Accounts Receivable Follow-Up','accounts-receivable-follow-up',
 'Structured, prioritized workdown of aging insurance receivables.',
 'A/R is segmented by age, payer, and balance so effort goes where recovery is most likely and most meaningful. Work activity is documented per account, giving your practice a defensible picture of what the A/R consists of at any moment.',
 'A/R aging analysis and segmentation\nPrioritized worklist by payer, age, and value\nClaim-level follow-up and documentation\nEscalation path for stalled accounts\nPeriodic A/R status reporting with trend lines',
 'A segmented, documented worklist replaces the anxiety of a single aging number with a managed, explainable process.',
 'A/R report access; current PM data; agreed prioritization rules; practice guidance on small-balance and write-off thresholds.',
 'HandCoins', 6),
('Revenue Cycle Workflow Support','revenue-cycle-workflow-support',
 'Practical support across the full revenue cycle, from intake to reporting.',
 'For practices that need broader support than a single function: coordinated assistance spanning front-end (scheduling data quality, eligibility), mid-cycle (charge capture, claim submission), and back-end (posting, follow-up, A/R) workflows — configured as one documented operating rhythm.',
 'Workflow mapping session with practice stakeholders\nDocumented operating procedures per function\nDaily/weekly task execution per agreement\nException handling with defined escalation paths\nContinuous refinement as payer behavior changes',
 'One accountable workflow across the revenue cycle removes the gaps where revenue typically leaks — between front desk, biller, and follow-up.',
 'Stakeholder availability for workflow mapping; systems access across functions in scope; executive sponsor for decisions.',
 'Workflow', 7),
('Billing Performance Reporting','billing-performance-reporting',
 'Clear, regular reporting on the billing activity that matters to your practice.',
 'Defined reporting delivered on an agreed schedule: charges, payments, adjustments, denial categories, A/R aging, and work-queue activity. Reports are built from your practice management data and explained in plain language, so numbers come with context rather than surprises.',
 'Agree report definitions and schedule with practice\nExtract and validate data from PM system\nProduce scheduled reports with commentary\nReview report content with practice on request\nAdjust report scope as practice needs evolve',
 'Practices make better decisions when billing activity is visible, consistent, and explained — reporting turns your data into an operating tool.',
 'Report and data access from your PM system; an agreed reporting calendar; practice contact for questions.',
 'BarChart3', 8),
('Medical Coding Support','medical-coding-support',
 'Coding review and support services, where qualified and offered.',
 'Support for coding-related administrative workflows — such as claim-level coding review for completeness, coordination with external certified coding resources, and feedback on documentation patterns that affect claim acceptance. Scope is defined per engagement and limited to services the business is qualified to provide. Certified coding, where required, is performed or supervised by appropriately credentialed professionals engaged for that purpose.',
 'Scope definition: which coding support tasks are in scope\nReview of claims for coding completeness issues\nFeedback loop to practice on documentation patterns\nCoordination with certified coding resources where needed\nCoding-related denial trends included in reporting',
 'Catching coding-related claim issues early reduces rework cycles and helps clinical documentation and billing stay aligned.',
 'Documentation access appropriate to scope; practice coding policy; agreement on when certified coder involvement is required.',
 'SquareCode', 9),
('Credentialing & Provider Enrollment','credentialing-provider-enrollment',
 'Credentialing and payer enrollment administrative support, where offered.',
 'Administrative coordination for provider credentialing and enrollment: application preparation support, document collection tracking, CAQH profile maintenance assistance, and enrollment status follow-up with payers. Timelines depend on payer processing and are communicated honestly — credentialing duration estimates are never guaranteed.',
 'Inventory of providers, licenses, and documents\nApplication and profile preparation support\nSubmission and status tracking per payer\nFollow-up on payer processing status\nEnrollment record maintenance and revalidation reminders',
 'Organized credentialing administration keeps provider enrollment from silently blocking billing — and keeps revalidation dates from being missed.',
 'Provider cooperation for document collection; access to credentialing data; realistic timeline expectations set together.',
 'IdCard', 10),
('Practice Billing Workflow Consulting','practice-billing-workflow-consulting',
 'Assessment and improvement guidance for in-house billing operations.',
 'For practices that keep billing in-house but want it to run better: a structured assessment of your current revenue cycle workflow, identification of friction and risk points, and a prioritized, written improvement plan your team can execute — with optional follow-up reviews.',
 'Discovery interviews with billing and front-desk staff\nWorkflow and systems documentation review\nWritten findings with prioritized recommendations\nImplementation planning session with your team\nOptional follow-up review after implementation period',
 'An outside, documentation-led review often surfaces the small process gaps — missed verifications, unworked queues, unclear ownership — that quietly cost practices time and money.',
 'Staff availability for interviews; read access to reports and workflows under NDA; a practice decision-maker for recommendations review.',
 'Compass', 11)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Professional experience (founder) — admin-editable.
-- Roles, dates, systems, and verified achievements are intentionally left
-- blank until the owner supplies specifics; empty fields are hidden on the
-- public page rather than shown as placeholders.
-- ---------------------------------------------------------------------
INSERT INTO experiences (organization, role, start_date, end_date, is_current, description, responsibilities, specialties, systems, clearinghouses, achievements, is_published, display_order) VALUES
('Bellmedex Pakistan', '', '', '', false,
 'Handled the day-to-day billing work for US providers: eligibility checks, claim preparation and submission, rejections, and payer follow-up when claims sat without an answer. High-volume work like this is where patterns show up, and it is where the habit of fixing the process instead of the individual claim started.',
 '["Eligibility and benefits verification","Claim preparation and submission","Rejection and denial follow-up","Payer status calls and documentation","Charge and encounter review"]'::jsonb,
 '["Primary care","Multi-specialty","Behavioral health"]'::jsonb, '[]'::jsonb, '[]'::jsonb, '', true, 1),
('RCM Matter / Tech Matter Pakistan', '', '', '', false,
 'Worked deeper in the revenue cycle here: aging reports, A/R workdowns, denial trends, and the reporting that shows a practice where money is actually stuck. This is where the habit of telling clients what the data said, even when it was not what they wanted to hear, took hold.',
 '["A/R aging analysis and workdown","Denial categorization and root-cause review","Payer follow-up and escalation","Payment posting and reconciliation support","Monthly billing performance reporting"]'::jsonb,
 '["Primary care","Physical and occupational therapy","Multi-specialty"]'::jsonb, '[]'::jsonb, '[]'::jsonb, '', true, 2),
('24-7 Consultancy Pakistan', '', '', '', false,
 'Consultancy work with providers who needed billing operations untangled rather than another vendor added. Reviewed workflows, cleaned up queues, and helped teams build routines they could keep using after the engagement ended.',
 '["Billing workflow assessment","Queue cleanup and prioritization","Process documentation","Front desk and billing handoff review","Staff guidance on follow-up routines"]'::jsonb,
 '["Primary care","Behavioral health","Laboratory and diagnostics"]'::jsonb, '[]'::jsonb, '[]'::jsonb, '', true, 3)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- Specialties (editable practice-type coverage)
-- ---------------------------------------------------------------------
INSERT INTO specialties (name, blurb, icon, display_order)
SELECT v.name, v.blurb, v.icon, v.display_order
FROM (VALUES
  ('Primary Care', 'High-volume office visits, preventive care, and chronic-condition follow-up. The work is less about complexity and more about consistency: clean charge capture, correct modifiers, and keeping small balances from piling up.', 'Stethoscope', 1),
  ('Behavioral Health', 'Time-based codes, authorization limits, and payers that each want something slightly different. Sessions get billed accurately only when the documentation and the claim tell the same story.', 'Brain', 2),
  ('Physical & Occupational Therapy', 'Visit caps, plan-of-care dates, and unit-based billing make therapy claims easy to get wrong. We keep the visit count and the authorization straight before the claim goes out.', 'Dumbbell', 3),
  ('Multi-Specialty Groups', 'Different providers, different payers, different rules under one roof. The work is keeping each service line''s workflow distinct instead of forcing everyone into one generic process.', 'ClipboardPlus', 4),
  ('Laboratory & Diagnostics', 'Order-to-claim matching, payer-specific coverage rules, and high claim volume. Small data errors get expensive fast, so the checks happen before submission, not after denial.', 'FlaskConical', 5),
  ('Dental', 'Dental and medical benefits often overlap, and the same procedure can land in either bucket. Clean coordination between the two saves patients and the front office a lot of confusion.', 'Smile', 6),
  ('Cardiology', 'Global periods, diagnostic testing, and payer medical-necessity rules. Cardiology billing rewards careful documentation review and disciplined follow-up on the claims that stall.', 'HeartPulse', 7),
  ('Pediatrics', 'Vaccine administration, well-child visits, and coverage that changes as patients age. The details matter more than the volume, especially when a payer wants vaccine records attached.', 'Baby', 8)
) AS v(name, blurb, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM specialties s WHERE s.name = v.name);

-- ---------------------------------------------------------------------
-- FAQs
-- ---------------------------------------------------------------------
INSERT INTO faqs (question, answer, category, display_order) VALUES
('What services does the company offer?',
 'The company provides medical billing and revenue cycle support services including claims submission, eligibility and benefits verification, insurance claim follow-up, denial management and appeals support, payment posting and reconciliation, accounts receivable follow-up, billing performance reporting, and billing workflow consulting. Medical coding support and credentialing support are offered where qualified and scoped per engagement. The Services page describes each offering in detail.',
 'Services', 1),
('Which healthcare practices can be supported?',
 'The practice focus is on US-based outpatient providers: solo and small group practices, behavioral health, physical and occupational therapy, primary care, multi-specialty groups, and similar organizations. If your specialty or setting is not listed, request a consultation — supportability depends on your specialty, payer mix, and practice management system, and we will tell you honestly if we are not the right fit.',
 'Services', 2),
('How does onboarding work?',
 'Onboarding follows a defined sequence: (1) an initial consultation to understand your practice and goals, (2) a workflow and systems assessment, (3) a written scope proposal covering services, cadence, and responsibilities, (4) agreements and secure access setup, and (5) a structured transition with a parallel-run period before full handoff. You review and approve each step before the next begins.',
 'Working together', 3),
('How are billing workflows coordinated day to day?',
 'Each engagement runs on documented operating procedures agreed during onboarding: which tasks are handled, in what system, on what cadence, and how exceptions are escalated. Work activity is logged, reporting is delivered on the agreed schedule, and you have a defined contact channel for questions and priorities.',
 'Working together', 4),
('How can a provider request a consultation?',
 'Use the consultation form on the Contact page. Provide your business contact details, practice type, the services you are interested in, and a short description of your situation. You will receive a response, typically within one to two business days, to schedule an introductory call.',
 'Getting started', 5),
('How is confidential information handled?',
 'The website inquiry form is for business contact information only — please never submit patient names, dates of birth, member IDs, diagnoses, or clinical documents through it. For active engagements, data handling expectations, access boundaries, and confidentiality obligations are established in written agreements before any practice or billing data is accessed. If an engagement later involves processing protected health information, HIPAA applicability, business associate agreements, and appropriate safeguards are addressed before that work begins.',
 'Privacy & security', 6),
('Can service arrangements be customized?',
 'Yes. Engagements are scoped per practice: you can engage a single function (for example, denial management or A/R follow-up) or broader revenue cycle support. Scope, cadence, reporting, and pricing structure are documented in the service agreement before work begins.',
 'Services', 7),
('What information should a provider prepare before an initial discussion?',
 'Helpful preparation includes: your practice size and specialty, your current practice management system, your approximate monthly claim volume, which billing workflows are handled in-house versus outsourced today, and the two or three billing pain points you most want to address. No patient-level data is needed for an initial discussion.',
 'Getting started', 8)
ON CONFLICT DO NOTHING;

COMMIT;
