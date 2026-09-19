import { withRequestLog } from "@/lib/logging";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requestSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import {
  Lead,
  InspectionRequest,
  PreorderRequest,
  ServiceRequest,
  ActivityLog,
} from "@/lib/models";
import { body, rateLimit, sameOrigin } from "@/lib/security";
async function handlePost(req: Request) {
  try {
    sameOrigin(req);
    if (!process.env.MONGODB_URI)
      return NextResponse.json(
        {
          error:
            "Online requests are not available yet. Please check back shortly.",
        },
        { status: 503 },
      );
    const parsed = requestSchema.safeParse(await body(req));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(". ") },
        { status: 400 },
      );
    await rateLimit(
      "request:" +
        (req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"),
    );
    await db();
    const reference = `BAW-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const session = await Lead.startSession();
    try {
      await session.withTransaction(async () => {
        const [lead] = await Lead.create([{ ...parsed.data, reference }], {
          session,
        });
        const data = { lead: lead._id, details: parsed.data.details };
        if (parsed.data.type === "INSPECTION")
          await InspectionRequest.create([data], { session });
        else if (parsed.data.type === "PREORDER")
          await PreorderRequest.create([data], { session });
        else if (!["CONTACT", "VEHICLE_INQUIRY"].includes(parsed.data.type))
          await ServiceRequest.create([{ ...data, type: parsed.data.type }], {
            session,
          });
        await ActivityLog.create(
          [
            {
              actor: "public",
              action: `New ${parsed.data.type.toLowerCase()} request`,
              entity: reference,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ reference }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return NextResponse.json(
      {
        error: message.startsWith("Too many")
          ? message
          : "We couldn’t save your request. Please try again.",
      },
      { status: message.startsWith("Too many") ? 429 : 400 },
    );
  }
}

export async function POST(req: Request) {
  return withRequestLog(req, () => handlePost(req));
}
