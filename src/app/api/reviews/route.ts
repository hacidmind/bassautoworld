import { withRequestLog } from "@/lib/logging";
import { NextResponse } from "next/server";
import { reviewSchema } from "@/lib/validation";
import { Review } from "@/lib/models";
import { body, rateLimit, sameOrigin } from "@/lib/security";
async function handlePost(req: Request) {
  try {
    sameOrigin(req);
    if (!process.env.MONGODB_URI)
      return NextResponse.json(
        {
          error:
            "Review submissions are not available yet. Please check back shortly.",
        },
        { status: 503 },
      );
    const input = reviewSchema.safeParse(await body(req));
    if (!input.success)
      return NextResponse.json(
        { error: input.error.issues.map((i) => i.message).join(". ") },
        { status: 400 },
      );
    await rateLimit(
      "review:" +
        (req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"),
      5,
    );
    await Review.create(input.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        route: "/api/reviews",
        errorType: error instanceof Error ? error.name : "unknown",
        code: (error as { code?: number })?.code,
      }),
    );
    return NextResponse.json(
      { error: "Unable to submit your review. Please try again later." },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  return withRequestLog(req, () => handlePost(req));
}
