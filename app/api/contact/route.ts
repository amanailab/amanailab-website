import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

// Prevent HTML injection in email body
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "contact", 3, 10 * 60_000);
  if (limited) return limited;
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.CONTACT_EMAIL!,
      replyTo: email,
      subject: `New message from ${name}${subject ? `: ${subject}` : ""}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Subject:</strong> ${esc(subject ?? '')}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;font-family:sans-serif">${esc(message)}</pre>
      `,
    });

    // Best-effort persistence so admins can browse messages later.
    // Silently ignored if the contact_messages table doesn't exist.
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      await supabase.from("contact_messages").insert({
        name,
        email,
        subject: subject ?? null,
        message,
      });
    } catch (storeErr) {
      console.warn("[Contact] Could not persist message:", storeErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact Form Error]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
