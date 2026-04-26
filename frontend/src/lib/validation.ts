// Per-step zod validation for the Aegis Notice intake form.
// Each schema validates ONLY the fields collected up to that step so users
// can't advance with missing or invalid data, and conditional fields
// (e.g. processor name when thirdParty=processor) are enforced.

import { z } from "zod";
import type { FormState } from "./aegis";

// ---------- shared primitives ----------

const trimmedString = (max: number, label: string) =>
  z.string().trim().max(max, { message: `${label} must be ${max} characters or less` });

const requiredString = (max: number, label: string) =>
  trimmedString(max, label).min(1, { message: `${label} is required` });

// ISO-ish datetime — accepts both "YYYY-MM-DDTHH:mm" (datetime-local input)
// and full ISO. Must be a real, parseable date in the past or now (±5min skew).
const discoveryTimeSchema = z
  .string()
  .trim()
  .min(1, { message: "Discovery time is required" })
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: "Discovery time must be a valid date/time",
  })
  .refine((v) => new Date(v).getTime() <= Date.now() + 5 * 60_000, {
    message: "Discovery time cannot be in the future",
  })
  .refine((v) => new Date(v).getTime() >= Date.now() - 365 * 24 * 3_600_000, {
    message: "Discovery time cannot be more than 1 year ago",
  });

// ---------- step schemas ----------

export const buildStep1Schema = (s: FormState) =>
  z
    .object({
      discoveryTime: discoveryTimeSchema,
      incidentType: z.enum(
        ["ransomware", "unauthorised-access", "accidental-disclosure", "insider-threat", "ot-ics", "lost-device", "other"],
        { errorMap: () => ({ message: "Select an incident type" }) },
      ),
      systemsAffected: trimmedString(500, "Systems affected"),
      ongoingStatus: z.string(),
      backupsAvailable: z.string(),
      deviceEncrypted: z.string(),
      exfiltrationConfirmed: z.string(),
    })
    .superRefine((val, ctx) => {
      if (s.incidentType === "ransomware" && !val.backupsAvailable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, path: ["backupsAvailable"],
          message: "Indicate whether clean backups are available (drives Art.34 risk evaluation)",
        });
      }
      if (s.incidentType === "lost-device" && !val.deviceEncrypted) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, path: ["deviceEncrypted"],
          message: "Indicate whether the device was encrypted (Art.34 exemption hinges on this)",
        });
      }
      if (s.incidentType === "unauthorised-access" && !val.exfiltrationConfirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, path: ["exfiltrationConfirmed"],
          message: "Indicate whether data exfiltration is confirmed",
        });
      }
    });

// Backwards-compatible static schema for callers that don't need conditionals.
export const step1Schema = buildStep1Schema({} as FormState);

export const step2Schema = z.object({
  dataCategories: z
    .array(z.string())
    .min(1, { message: "Select at least one data category (or 'Unknown')" }),
  numAffected: z.enum(["u50", "50-500", "500-5k", "5k-50k", "o50k", "unknown"], {
    errorMap: () => ({ message: "Select the number of affected individuals" }),
  }),
  harmTypes: z
    .array(z.string())
    .min(1, { message: "Select at least one foreseeable harm (or 'None')" }),
});

export const step3Schema = z.object({
  sector: z.enum(
    ["automotive", "energy", "lifesciences", "financial", "consumer", "telecom", "transport", "digital", "other"],
    { errorMap: () => ({ message: "Select your sector" }) },
  ),
  jurisdiction: z
    .string()
    .min(2, { message: "Select the lead jurisdiction" })
    .max(2),
  thirdParty: z.enum(["no", "processor", "third-controller", "joint", "unknown"], {
    errorMap: () => ({ message: "Select third-party involvement" }),
  }),
});

// Step 3.5 — conditional fields based on prior answers.
// Use a function so we can build conditional requirements.
export const buildStep35Schema = (s: FormState) =>
  z
    .object({
      controllerName: requiredString(200, "Controller name"),
      dpoContact: trimmedString(200, "DPO contact").refine(
        (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?[0-9 ()\-.]{6,}$/.test(v),
        { message: "DPO contact must be an email or phone number" },
      ),
      processorName: trimmedString(200, "Processor name"),
      dpaClauseStatus: z.string(),
      crossBorder: z.enum(["yes", "no", "unknown"], {
        errorMap: () => ({ message: "Indicate cross-border processing status" }),
      }),
      affectedMemberStates: trimmedString(500, "Affected member states"),
      csirtContact: trimmedString(200, "CSIRT contact"),
      ictThirdParty: trimmedString(500, "ICT third party"),
      legalPrivilege: z.enum(["engaged", "not-engaged", "unknown"], {
        errorMap: () => ({ message: "Indicate legal privilege posture" }),
      }),
      outsideCounsel: trimmedString(200, "Outside counsel"),
      retentionBasis: trimmedString(500, "Retention basis"),
    })
    .superRefine((val, ctx) => {
      if (s.thirdParty === "processor" || s.thirdParty === "joint") {
        if (!val.processorName)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["processorName"],
            message: "Processor / joint controller name is required",
          });
        if (!val.dpaClauseStatus)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dpaClauseStatus"],
            message: "DPA clause status is required",
          });
      }
      if (val.crossBorder === "yes" && !val.affectedMemberStates) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["affectedMemberStates"],
          message: "List affected member states",
        });
      }
      if (
        (s.sector === "automotive" || s.sector === "energy" || s.sector === "lifesciences" ||
          s.sector === "telecom" || s.sector === "transport" || s.sector === "digital") &&
        !val.csirtContact
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["csirtContact"],
          message: "CSIRT / national authority contact is required for NIS2 sectors",
        });
      }
      if (s.sector === "financial" && !val.ictThirdParty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ictThirdParty"],
          message: "ICT third party detail is required under DORA",
        });
      }
      if (val.legalPrivilege === "engaged" && !val.outsideCounsel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["outsideCounsel"],
          message: "Outside counsel name is required when privilege is engaged",
        });
      }
    });

// ---------- public API ----------

export type StepErrors = Record<string, string>;

export interface ValidationResult {
  ok: boolean;
  errors: StepErrors;
  firstMessage?: string;
}

const flatten = (err: z.ZodError): StepErrors => {
  const out: StepErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
};

export function validateStep(step: 1 | 2 | 3 | 35, state: FormState): ValidationResult {
  let result: z.SafeParseReturnType<unknown, unknown>;
  switch (step) {
    case 1:
      result = buildStep1Schema(state).safeParse(state);
      break;
    case 2:
      result = step2Schema.safeParse(state);
      break;
    case 3:
      result = step3Schema.safeParse(state);
      break;
    case 35:
      result = buildStep35Schema(state).safeParse(state);
      break;
  }
  if (result.success) return { ok: true, errors: {} };
  const errors = flatten(result.error);
  return { ok: false, errors, firstMessage: Object.values(errors)[0] };
}

// Aggregate validation across every step — used by the Review screen so the
// user can see and fix any remaining issues before generating the assessment.
export interface AggregatedReview {
  ok: boolean;
  perStep: { step: 1 | 2 | 3 | 35; ok: boolean; errors: StepErrors }[];
  totalErrors: number;
}
export function validateAll(state: FormState): AggregatedReview {
  const steps: (1 | 2 | 3 | 35)[] = [1, 2, 3, 35];
  const perStep = steps.map(s => {
    const r = validateStep(s, state);
    return { step: s, ok: r.ok, errors: r.errors };
  });
  const totalErrors = perStep.reduce((acc, s) => acc + Object.keys(s.errors).length, 0);
  return { ok: perStep.every(s => s.ok), perStep, totalErrors };
}
