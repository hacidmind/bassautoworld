import { withRequestLog } from "@/lib/logging";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/auth";
import { body, rateLimit, sameOrigin } from "@/lib/security";
async function handlePost(req: Request) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (input.review !== true) await requireAdmin();
    else
      await rateLimit(
        "upload:" +
          (req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"),
        3,
      );
    const {
      CLOUDINARY_CLOUD_NAME: cloudName,
      CLOUDINARY_API_KEY: apiKey,
      CLOUDINARY_API_SECRET: secret,
    } = process.env;
    if (!cloudName || !apiKey || !secret)
      return NextResponse.json(
        { error: "Image uploads are not configured yet." },
        { status: 503 },
      );
    const params = {
      timestamp: Math.floor(Date.now() / 1000),
      public_id: `bassautoworld/${input.review ? "reviews" : "vehicles"}/${randomUUID()}`,
      overwrite: false,
      allowed_formats: "jpg,jpeg,png,webp,heic,heif",
    };
    return NextResponse.json({
      cloudName,
      apiKey,
      params,
      signature: cloudinary.utils.api_sign_request(params, secret),
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to authorize this upload. Please sign in or try again later.",
      },
      { status: 403 },
    );
  }
}

export async function POST(req: Request) {
  return withRequestLog(req, () => handlePost(req));
}
