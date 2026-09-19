import { z } from "zod";
export function isHttpsUrl(value: string, hosts?: string[]) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && (!hosts || hosts.includes(url.hostname))
    );
  } catch {
    return false;
  }
}
export const leadTypes = [
  "VEHICLE_INQUIRY",
  "INSPECTION",
  "PREORDER",
  "SHIPPING",
  "CLEARING",
  "TRUCKING",
  "AUCTION_SOURCING",
  "IMPORTATION",
  "FORWARDING",
  "CONTACT",
] as const;
export const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "QUOTE_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
  "CLOSED",
] as const;
export const sources = [
  "WEBSITE",
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "REFERRAL",
  "GOOGLE",
  "WHATSAPP",
  "WALK_IN",
  "OTHER",
] as const;
const text = z.string().trim().max(2000);
export const requestSchema = z
  .object({
    type: z.enum(leadTypes),
    name: z.string().trim().min(2, "Enter your name").max(100),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(30)
      .regex(/^[+\d\s()\-]+$/, "Enter a valid phone number"),
    email: z.union([z.email(), z.literal("")]),
    vehicle: text.optional(),
    source: z.enum(sources).default("WEBSITE"),
    referralCode: text.optional(),
    referrerName: text.optional(),
    website: z.string().max(0).optional(),
    details: z.record(z.string().max(50), text).default({}),
  })
  .superRefine((v, ctx) => {
    const required: Record<string, string[]> = {
      INSPECTION: ["inspectionType", "date", "time"],
      PREORDER: [
        "make",
        "model",
        "yearFrom",
        "yearTo",
        "budget",
        "currency",
        "delivery",
        "timeline",
      ],
      SHIPPING: [
        "originCountry",
        "origin",
        "destination",
        "vehicleDescription",
        "running",
      ],
      TRUCKING: [
        "pickup",
        "destination",
        "vehicleDescription",
        "running",
        "date",
      ],
      AUCTION_SOURCING: ["platform", "auctionUrl", "budget"],
      IMPORTATION: ["vehicleDescription", "destination"],
      CLEARING: ["origin", "destination"],
      FORWARDING: ["origin", "destination"],
    };
    for (const k of required[v.type] || [])
      if (!v.details[k]?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["details", k],
          message: "This field is required",
        });
    if (v.type === "INSPECTION" && !v.vehicle)
      ctx.addIssue({
        code: "custom",
        path: ["vehicle"],
        message: "Select or enter a vehicle",
      });
    if (v.details.budget && !(Number(v.details.budget) > 0))
      ctx.addIssue({
        code: "custom",
        path: ["details", "budget"],
        message: "Enter a positive budget",
      });
    if (
      v.details.yearFrom &&
      Number(v.details.yearFrom) > Number(v.details.yearTo)
    )
      ctx.addIssue({
        code: "custom",
        path: ["details", "yearTo"],
        message: "End year must follow start year",
      });
    if (
      v.details.date &&
      v.details.date < new Date().toISOString().slice(0, 10)
    )
      ctx.addIssue({
        code: "custom",
        path: ["details", "date"],
        message: "Choose today or a future date",
      });
    for (const key of ["yearFrom", "yearTo"]) {
      if (
        v.details[key] &&
        (!/^\d{4}$/.test(v.details[key]) ||
          Number(v.details[key]) < 1900 ||
          Number(v.details[key]) > new Date().getFullYear() + 2)
      )
        ctx.addIssue({
          code: "custom",
          path: ["details", key],
          message: "Enter a valid vehicle year",
        });
    }
    for (const key of ["maxMileage"]) {
      if (
        v.details[key] &&
        (!Number.isFinite(Number(v.details[key])) || Number(v.details[key]) < 0)
      )
        ctx.addIssue({
          code: "custom",
          path: ["details", key],
          message: "Enter a valid mileage",
        });
    }
    if (
      v.details.date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(v.details.date) ||
        Number.isNaN(Date.parse(v.details.date)))
    )
      ctx.addIssue({
        code: "custom",
        path: ["details", "date"],
        message: "Enter a valid date",
      });
    if (v.details.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.details.time))
      ctx.addIssue({
        code: "custom",
        path: ["details", "time"],
        message: "Enter a valid time",
      });
    if (
      v.details.inspectionType &&
      ![
        "Physical viewing",
        "Mechanic inspection",
        "Video inspection",
        "Remote inspection",
      ].includes(v.details.inspectionType)
    )
      ctx.addIssue({
        code: "custom",
        path: ["details", "inspectionType"],
        message: "Choose an inspection type",
      });
    if (
      v.details.currency &&
      !["NGN", "USD", "GBP", "EUR"].includes(v.details.currency)
    )
      ctx.addIssue({
        code: "custom",
        path: ["details", "currency"],
        message: "Choose a supported currency",
      });
    if (v.details.auctionUrl && !/^https:\/\//.test(v.details.auctionUrl))
      ctx.addIssue({
        code: "custom",
        path: ["details", "auctionUrl"],
        message: "Enter an HTTPS auction URL",
      });
  });
export const imageSchema = z.object({
  publicId: z.string().min(1).max(300),
  secureUrl: z
    .url()
    .refine(
      (v) => isHttpsUrl(v, ["res.cloudinary.com"]),
      "Use a Cloudinary image",
    ),
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.string().max(10),
  alt: z.string().max(250),
  sortOrder: z.number().int().min(0),
});
export const vehicleSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    stockNumber: z.string().min(2).max(50),
    make: z.string().min(1).max(80),
    model: z.string().min(1).max(80),
    year: z.coerce
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 2),
    trim: z.string().max(100).default(""),
    price: z.coerce.number().min(0),
    currency: z.enum(["NGN", "USD", "GBP", "EUR"]).default("NGN"),
    mileage: z.coerce.number().min(0),
    location: z.string().min(1).max(200),
    engine: text.default(""),
    transmission: text.default(""),
    drivetrain: text.default(""),
    fuelType: text.default(""),
    exteriorColor: text.default(""),
    interiorColor: text.default(""),
    vin: z.string().max(17).default(""),
    description: z.string().max(15000).default(""),
    descriptionHtml: z.string().max(60000).optional(),
    condition: text.default(""),
    features: z.array(z.string().max(150)).max(100).default([]),
    images: z.array(imageSchema).max(30).default([]),
    instagramUrl: z
      .union([
        z
          .url()
          .refine((v) => isHttpsUrl(v, ["instagram.com", "www.instagram.com"])),
        z.literal(""),
      ])
      .default(""),
    status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "INCOMING"]),
    published: z.boolean(),
    archived: z.boolean().default(false),
    featured: z.boolean(),
  })
  .refine((v) => !v.published || v.images.length > 0, {
    message: "Add at least one image before publishing",
    path: ["images"],
  });
export const reviewSchema = z.object({
  name: z.string().trim().min(2).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().min(10).max(3000),
  vehicle: text,
  transactionType: text,
  image: imageSchema.optional(),
  videoUrl: z
    .union([z.url().refine((v) => isHttpsUrl(v)), z.literal("")])
    .optional(),
});
