import { supabase } from "@/integrations/supabase/client";
import type { AIAssessment } from "./types";

export interface LDASource {
  source?: string;
  oso_url?: string;
  source_indicator?: string;
  [k: string]: unknown;
}

export interface LDAResult {
  answer: string;
  sources: LDASource[];
  skipped?: string;
}

export const LDA_PROMPTS = {
  gdpr: "What are the criteria for determining whether a personal data breach must be notified to a supervisory authority under GDPR Article 33, and when must individuals be notified under Article 34?",
  nis2: "What are the incident notification obligations under NIS2 Directive Article 23 for essential and important entities, including the 24-hour early warning and 72-hour notification deadlines?",
  dora: "What are the ICT-related incident reporting requirements under DORA Article 19, including the timeline for initial, intermediate and final reports to competent authorities?",
};

export const getLDAToken = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("query-lda", {
      body: { prompt: "ping" },
    });
    if (error || !data || data.error) return null;
    if (data.skipped) return null;
    return "server-managed";
  } catch {
    return null;
  }
};

export const queryLDA = async (_token: string, prompt: string): Promise<LDAResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("query-lda", {
      body: { prompt },
    });
    if (error || !data || data.error) return { answer: "", sources: [] };
    return {
      answer: data.answer ?? "",
      sources: Array.isArray(data.sources) ? data.sources : [],
      skipped: typeof data.skipped === "string" ? data.skipped : undefined,
    };
  } catch {
    return { answer: "", sources: [] };
  }
};

export const callOpenAI = async (userMessage: string): Promise<AIAssessment | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("assess-breach", {
      body: { userMessage },
    });
    if (error || !data || data.error || !data.assessment) {
      console.error("assess-breach error", error || data?.error);
      return null;
    }
    return data.assessment as AIAssessment;
  } catch (e) {
    console.error("callOpenAI exception", e);
    return null;
  }
};
