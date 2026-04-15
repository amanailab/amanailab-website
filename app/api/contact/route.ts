import { NextResponse } from "next/server";

export async function POST(req: Request) {
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

    // ── Integrate your email provider here ───────────────────────────────────
    // Option 1 – Resend:
    //   await resend.emails.send({ from: '...', to: 'hello@amanailab.com', subject, html })
    // Option 2 – Nodemailer:
    //   await transporter.sendMail({ from: email, to: 'hello@amanailab.com', subject, text: message })
    // ─────────────────────────────────────────────────────────────────────────

    console.log("[Contact Form]", { name, email, subject, message, at: new Date().toISOString() });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact Form Error]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
