export type EmailSource =
  | "resume_analyzer"
  | "interview_simulator"
  | "blog"
  | "news_page"
  | "linkedin_generator"
  | "linkedin_optimizer"
  | "cover_letter_reviewer"
  | "skill_quiz"
  | "prompt_generator"
  | "career_tools";

export const EMAIL_CAPTURED_KEY = "email_captured";

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

/**
 * Submit email via server-side API which:
 * 1. Validates format strictly
 * 2. Blocks disposable domains
 * 3. Saves to Supabase with verified: false
 * 4. Sends a verification email via Resend
 *
 * Returns { ok: true } on success or { ok: false, error: string } on failure.
 */
export async function saveEmail(
  rawEmail: string,
  source: EmailSource
): Promise<boolean> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return false;

  try {
    const res = await fetch("/api/email/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Surface validation errors so the UI can show them
      throw new Error(data.error ?? "Failed to subscribe.");
    }

    return true;
  } catch (err) {
    // Re-throw so callers can display the message
    throw err;
  }
}
