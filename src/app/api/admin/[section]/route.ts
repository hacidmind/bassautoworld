import { cleanDescription, descriptionText } from "@/lib/description";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { requireAdmin } from "@/auth";
import {
  Vehicle,
  Lead,
  Review,
  SiteSetting,
  ActivityLog,
  InspectionRequest,
} from "@/lib/models";
import { vehicleSchema, leadStatuses, isHttpsUrl } from "@/lib/validation";
import { body, sameOrigin } from "@/lib/security";
import { removeUnusedVehicleImages } from "@/lib/cloudinary";
const optionalUrl = z
  .union([z.url().refine((v) => isHttpsUrl(v)), z.literal("")])
  .optional();
const settingSchema = z.object({
  phone: z.string().max(40).optional(),
  whatsapp: z
    .string()
    .regex(/^[+\d\s-]*$/)
    .max(30)
    .optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  address: z.string().max(500).optional(),
  instagram: optionalUrl,
  facebook: optionalUrl,
  tiktok: optionalUrl,
  logoUrl: z
    .union([
      z.url().refine((v) => isHttpsUrl(v, ["res.cloudinary.com"])),
      z.literal(""),
    ])
    .optional(),
  description: z.string().max(5000).optional(),
  trustStatement: z.string().max(1000).optional(),
});
async function mutate(
  req: Request,
  context: { params: Promise<{ section: string }> },
) {
  try {
    sameOrigin(req);
    const user = await requireAdmin();
    const { section } = await context.params;
    const input = await body(req);
    const id = input.id;
    if (req.method === "PATCH" && (!id || !isValidObjectId(id)))
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    let record;
    if (section === "vehicles") {
      if (typeof input.descriptionHtml === "string") {
        if (input.descriptionHtml.length > 60000)
          return NextResponse.json(
            { error: "Description is too long." },
            { status: 400 },
          );
        input.descriptionHtml = cleanDescription(input.descriptionHtml);
        input.description = descriptionText(input.descriptionHtml);
      } else if (typeof input.description === "string") {
        // Plain-text edits from older clients replace the previous rich version.
        input.descriptionHtml = "";
      }
      if (id) {
        const existing = await Vehicle.findById(id);
        if (!existing)
          return NextResponse.json(
            { error: "Vehicle not found" },
            { status: 404 },
          );
        const data = vehicleSchema.parse({ ...existing.toObject(), ...input });
        record = await Vehicle.findByIdAndUpdate(
          id,
          { $set: data },
          { returnDocument: "after", runValidators: true },
        );
        const retained = new Set(data.images.map((image) => image.publicId));
        await removeUnusedVehicleImages(
          existing.images
            .map((image: { publicId: string }) => image.publicId)
            .filter((publicId: string) => !retained.has(publicId)),
        );
      } else {
        const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
        const name = [input.year, input.make, input.model]
          .join("-")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 130)
          .replace(/-$/, "");
        record = await Vehicle.create(
          vehicleSchema.parse({
            ...input,
            slug: input.slug || (name || "vehicle") + "-" + suffix,
            stockNumber: input.stockNumber || "BAW-" + suffix.toUpperCase(),
          }),
        );
      }
    } else if (section === "leads" && id) {
      const data = z
        .object({
          status: z.enum(leadStatuses).optional(),
          inspectionStatus: z
            .enum([
              "NEW",
              "CONTACTED",
              "SCHEDULED",
              "COMPLETED",
              "CANCELLED",
              "CLOSED",
            ])
            .optional(),
        })
        .parse(input);
      record = await Lead.findById(id);
      if (!record)
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      if (data.status) {
        record.status = data.status;
        await record.save();
      }
      if (data.inspectionStatus && record.type === "INSPECTION") {
        await InspectionRequest.findOneAndUpdate(
          { lead: id },
          { $set: { status: data.inspectionStatus } },
        );
      }
    } else if (section === "reviews" && id) {
      const data = z
        .object({
          status: z
            .enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"])
            .optional(),
          featured: z.boolean().optional(),
        })
        .parse(input);
      record = await Review.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after" },
      );
    } else if (section === "settings") {
      const data = settingSchema.parse(input);
      record = await SiteSetting.findOneAndUpdate(
        { key: "business" },
        { $set: { value: data } },
        { upsert: true, returnDocument: "after" },
      );
    } else
      return NextResponse.json(
        { error: "Unsupported operation" },
        { status: 400 },
      );
    if (!record)
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    await ActivityLog.create({
      actor: String(user._id),
      action: `${req.method === "PATCH" ? "Updated" : "Saved"} ${section}`,
      entity: String(record._id),
    });
    return NextResponse.json({
      id: String(record._id),
      ...(section === "vehicles" ? { slug: record.slug } : {}),
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(". "),
        },
        { status: 400 },
      );
    if (e instanceof Error && e.message === "Unauthorized")
      return NextResponse.json(
        { error: "Please sign in as an administrator." },
        { status: 401 },
      );
    if ((e as { code?: number })?.code === 11000)
      return NextResponse.json(
        { error: "That slug or stock number already exists." },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Unable to save this record. Please try again." },
      { status: 400 },
    );
  }
}
export const POST = mutate;
export const PATCH = mutate;
