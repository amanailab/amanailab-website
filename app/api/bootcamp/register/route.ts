import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: unknown; email?: unknown; phone?: unknown };

    const name  = typeof body.name  === "string" ? body.name.trim()                   : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase()    : "";
    const phone = typeof body.phone === "string" ? body.phone.trim()                  : "";

    if (!name)                    return NextResponse.json({ error: "Name is required."             }, { status: 400 });
    if (!EMAIL_RE.test(email))    return NextResponse.json({ error: "Valid email is required."      }, { status: 400 });
    if (!phone || phone.length < 7) return NextResponse.json({ error: "Valid phone is required."   }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabase
      .from("bootcamp_registrations")
      .insert({ name, email, phone });

    if (error) {
      // 23505 = unique violation (duplicate email) — treat as success from user's POV
      if ((error as { code?: string }).code !== "23505") {
        console.error("[Bootcamp register] Supabase error:", error);
        return NextResponse.json({ error: "Could not save registration." }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Bootcamp register] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
