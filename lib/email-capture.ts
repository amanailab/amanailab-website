import { createClient } from "@supabase/supabase-js";

export type EmailSource =
  | "resume_analyzer"
  | "interview_simulator"
  | "blog"
  | "news_page"
  | "linkedin_generator"
  | "linkedin_optimizer"
  | "cover_letter_reviewer"
  | "skill_quiz"
  | "prompt_generator";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_CAPTURED_KEY = "email_captured";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function isCaptured(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(EMAIL_CAPTURED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markCaptured(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EMAIL_CAPTURED_KEY, "1");
  } catch {
    // ignore
  }
}

export async function saveEmail(
  rawEmail: string,
  source: EmailSource
): Promise<boolean> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) return false;

  // First try with the source column (preferred). If the column doesn't
  // exist yet (PGRST204), fall back to a plain insert so the feature
  // still works before the migration is applied.
  const withSource = await supabase
    .from("newsletter_subscribers")
    .insert({ email, source });

  if (!withSource.error) return true;

  const code = (withSource.error as { code?: string }).code;
  const message = withSource.error.message?.toLowerCase() ?? "";

  // 23505 = unique_violation → already subscribed, treat as success.
  if (code === "23505" || message.includes("duplicate")) {
    return true;
  }

  // PGRST204 = column not found in schema cache.
  if (
    code === "PGRST204" ||
    message.includes("column") ||
    message.includes("source")
  ) {
    const fallback = await supabase
      .from("newsletter_subscribers")
      .insert({ email });
    if (!fallback.error) return true;
    const fbCode = (fallback.error as { code?: string }).code;
    const fbMessage = fallback.error.message?.toLowerCase() ?? "";
    if (fbCode === "23505" || fbMessage.includes("duplicate")) return true;
    console.error("[saveEmail] fallback error:", fallback.error);
    return false;
  }

  console.error("[saveEmail] error:", withSource.error);
  return false;
}
