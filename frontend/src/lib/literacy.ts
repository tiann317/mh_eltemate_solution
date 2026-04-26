// Auto-classify a reporter as "qualified" (technically literate enough to
// answer the full intake) or "non_qualified" (route to plain-language path).
//
// Strategy: keyword match on title + role + department, then confirm with
// 3 self-check questions. If 2+ self-checks indicate confidence we keep the
// classification; if not, we downgrade to non_qualified to be safe.

const QUALIFIED_KEYWORDS = [
  // titles / roles
  "ciso", "cto", "cio", "cso", "vp engineering", "vp eng", "vp security",
  "head of security", "head of it", "head of infosec", "head of engineering",
  "security engineer", "security analyst", "security architect",
  "soc analyst", "incident response", "ir analyst", "ir lead",
  "dpo", "data protection officer",
  "devops", "sre", "site reliability",
  "sysadmin", "system administrator", "network engineer",
  "it manager", "it director", "infosec", "cyber",
  "penetration tester", "pentester", "red team", "blue team",
  "forensics", "threat intel",
  "engineer", "developer", "software engineer", "platform engineer",
  "legal counsel", "general counsel", "lawyer", "compliance officer",
  // departments
  "security", "information security", "cybersecurity",
  "it", "information technology", "engineering", "platform", "infrastructure",
  "legal", "compliance", "risk",
];

export type Literacy = "qualified" | "non_qualified";

export interface PreIntakeInput {
  title?: string;
  role?: string;
  department?: string;
  selfCheck1?: string; // "yes" | "no" | "unsure"
  selfCheck2?: string;
  selfCheck3?: string;
}

export function classifyLiteracy(input: PreIntakeInput): Literacy {
  const haystack = [input.title, input.role, input.department]
    .filter(Boolean).join(" ").toLowerCase();
  const keywordHit = QUALIFIED_KEYWORDS.some(k => haystack.includes(k));

  const checks = [input.selfCheck1, input.selfCheck2, input.selfCheck3];
  const yesCount = checks.filter(c => c === "yes").length;
  const noCount = checks.filter(c => c === "no").length;

  // Strong signal: keyword + at least 2 confident "yes" → qualified.
  if (keywordHit && yesCount >= 2) return "qualified";
  // No keyword but 3 confident yes → still qualified.
  if (!keywordHit && yesCount === 3) return "qualified";
  // 2+ "no" → definitely non-qualified, regardless of title.
  if (noCount >= 2) return "non_qualified";
  // Default: be safe.
  return "non_qualified";
}

// Top-10 plain-language prompts shown to non-qualified reporters as
// gentle hints for their story. Mapped to incident questions a triage
// staff member would normally ask.
export const TOP_TEN_PROMPTS: { q: string; hint: string }[] = [
  { q: "When did you first notice something was wrong?", hint: "Date, time, even approximate is fine." },
  { q: "What did you see, hear, or receive?", hint: "An email, a popup, a phone call, a strange screen, a colleague telling you." },
  { q: "What were you doing right before it happened?", hint: "Opening a file, clicking a link, logging in, plugging in a device." },
  { q: "Did you click on, open, or download anything unusual?", hint: "Attachments, links, programs you don't recognise." },
  { q: "Have you entered your password anywhere unusual recently?", hint: "Including login pages that looked slightly off." },
  { q: "Is anything missing, changed, or locked?", hint: "Files, emails, screens you can't access, money, customer data." },
  { q: "Are other people in your team seeing the same thing?", hint: "If yes, roughly how many?" },
  { q: "Does this involve customer or personal data?", hint: "Names, emails, IDs, payment info, health info." },
  { q: "Have you turned anything off, disconnected anything, or restarted?", hint: "Useful for the technical team to know." },
  { q: "Who else have you told so far?", hint: "Manager, IT, colleague, external party." },
];
