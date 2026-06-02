import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Automated endpoint — require the cron secret so it can't be triggered by
  // the public to fan out expensive AI calls.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  try {
    const res = await fetch(`${origin}/api/news/fetch`, {
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: `Auto-refresh complete: ${data.message ?? ""}`,
    });
  } catch (err) {
    console.error("[auto-refresh] Error:", err);
    return NextResponse.json(
      { success: false, message: "Auto-refresh failed." },
      { status: 500 }
    );
  }
}
