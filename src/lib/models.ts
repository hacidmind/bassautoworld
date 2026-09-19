import mongoose, { Schema } from "mongoose";
const model = (name: string, schema: Schema) =>
  mongoose.models[name] || mongoose.model(name, schema);
const image = new Schema(
  {
    publicId: String,
    secureUrl: String,
    width: Number,
    height: Number,
    format: String,
    alt: String,
    sortOrder: Number,
  },
  { _id: false },
);
export const User = model(
  "User",
  new Schema(
    {
      email: { type: String, unique: true },
        passwordHash: String,
        resetToken: String,
        resetExpires: Date,
      role: { type: String, enum: ["ADMIN", "SUPER_ADMIN"] },
      active: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
);
export const Vehicle = model(
  "Vehicle",
  new Schema(
    {
      slug: { type: String, unique: true },
      stockNumber: { type: String, unique: true },
      make: String,
      model: String,
      year: Number,
      trim: String,
      price: Number,
      currency: { type: String, default: "NGN" },
      mileage: Number,
      location: String,
      engine: String,
      transmission: String,
      drivetrain: String,
      fuelType: String,
      exteriorColor: String,
      interiorColor: String,
      vin: String,
      description: String,
      descriptionHtml: String,
      condition: String,
      features: [String],
      images: [image],
      instagramUrl: String,
      status: {
        type: String,
        enum: ["AVAILABLE", "RESERVED", "SOLD", "INCOMING"],
        default: "AVAILABLE",
      },
      published: { type: Boolean, default: false },
      archived: { type: Boolean, default: false },
      featured: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
const leadSchema = new Schema(
  {
    reference: { type: String, unique: true },
    type: String,
    status: { type: String, default: "NEW" },
    name: String,
    phone: String,
    email: String,
    vehicle: String,
    source: String,
    referralCode: String,
    referrerName: String,
    details: Schema.Types.Mixed,
  },
  { timestamps: true },
);
leadSchema.index({ type: 1, status: 1, createdAt: -1 });
export const Lead = model("Lead", leadSchema);
export const InspectionRequest = model(
  "InspectionRequest",
  new Schema(
    {
      lead: { type: Schema.Types.ObjectId, ref: "Lead" },
      status: { type: String, default: "NEW" },
      details: Schema.Types.Mixed,
    },
    { timestamps: true },
  ),
);
export const PreorderRequest = model(
  "PreorderRequest",
  new Schema(
    {
      lead: { type: Schema.Types.ObjectId, ref: "Lead" },
      details: Schema.Types.Mixed,
    },
    { timestamps: true },
  ),
);
export const ServiceRequest = model(
  "ServiceRequest",
  new Schema(
    {
      lead: { type: Schema.Types.ObjectId, ref: "Lead" },
      type: String,
      details: Schema.Types.Mixed,
    },
    { timestamps: true },
  ),
);
export const Review = model(
  "Review",
  new Schema(
    {
      name: String,
      rating: Number,
      review: String,
      vehicle: String,
      transactionType: String,
      image,
      videoUrl: String,
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "HIDDEN"],
        default: "PENDING",
      },
      featured: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
export const SiteSetting = model(
  "SiteSetting",
  new Schema(
    { key: { type: String, unique: true }, value: Schema.Types.Mixed },
    { timestamps: true },
  ),
);
export const ActivityLog = model(
  "ActivityLog",
  new Schema(
    { actor: String, action: String, entity: String },
    { timestamps: true },
  ),
);
export const RateLimit = model(
  "RateLimit",
  new Schema({
    _id: String,
    count: Number,
    expiresAt: { type: Date, index: { expires: 0 } },
  }),
);
