import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
