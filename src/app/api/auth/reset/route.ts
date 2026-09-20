import { NextResponse } from "next/server";

// Disabled until a verified email delivery flow is available. Never log reset links.
export async function POST() {
  return NextResponse.json(
    { error: "Password recovery is unavailable. Contact the site administrator." },
    { status: 503 },
  );
}
