import { canReachMongo, db } from "./db";
import { Vehicle, SiteSetting, Review } from "./models";
const businessDefaults = {
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347060558970",
};
export type Car = {
  _id: string;
  slug: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  price: number;
  currency: string;
  mileage: number;
  location: string;
  status: string;
  description: string;
  condition: string;
  features: string[];
  images: { secureUrl: string; alt: string; publicId: string }[];
  [key: string]: unknown;
};
export const heroImage = "/images/hero.jpg";
export const services = [
  {
    slug: "importation",
    name: "Vehicle importation",
    tag: "FROM ANYWHERE",
    description:
      "Your next vehicle, sourced beyond borders. We coordinate sourcing, purchase and the journey home.",
  },
  {
    slug: "auction-sourcing",
    name: "Auction sourcing",
    tag: "MORE POSSIBILITIES",
    description:
      "Get support reviewing vehicles on independent auction platforms, including Copart and IAAI.",
  },
  {
    slug: "shipping",
    name: "Shipping & freight",
    tag: "ACROSS OCEANS",
    description:
      "From origin port to destination, we coordinate vehicle shipping with shipping companies.",
  },
  {
    slug: "clearing-forwarding",
    name: "Clearing & forwarding",
    tag: "THROUGH THE DETAILS",
    description:
      "Practical support with port procedures, clearing and onward movement.",
  },
  {
    slug: "trucking",
    name: "Trucking & delivery",
    tag: "THE FINAL MILE",
    description:
      "Coordinate vehicle collection and delivery to your preferred destination.",
  },
];
export async function cars(): Promise<Car[]> {
  if (!process.env.MONGODB_URI) return [];
  if (!(await canReachMongo(process.env.MONGODB_URI))) return [];
  try {
    await db();
    return JSON.parse(
      JSON.stringify(
        await Vehicle.find({ published: true, archived: false })
          .sort({ createdAt: -1 })
          .limit(500)
          .lean(),
      ),
    );
  } catch (error) {
    console.error("Failed to load published vehicles:", error);
    return [];
  }
}
export async function settings(): Promise<Record<string, string>> {
  if (!process.env.MONGODB_URI) return businessDefaults;
  if (!(await canReachMongo(process.env.MONGODB_URI))) return businessDefaults;
  try {
    await db();
    const s = await SiteSetting.findOne({ key: "business" }).lean();
    const values = (s?.value || {}) as Record<string, string>;
    return {
      ...businessDefaults,
      ...values,
      whatsapp: values.whatsapp || businessDefaults.whatsapp,
    };
  } catch (error) {
    console.error("Failed to load site settings:", error);
    return businessDefaults;
  }
}
export async function reviews() {
  if (!process.env.MONGODB_URI) return [];
  if (!(await canReachMongo(process.env.MONGODB_URI))) return [];
  try {
    await db();
    return JSON.parse(
      JSON.stringify(
        await Review.find({ status: "APPROVED" })
          .sort({ featured: -1, createdAt: -1 })
          .limit(50)
          .lean(),
      ),
    );
  } catch (error) {
    console.error("Failed to load approved reviews:", error);
    return [];
  }
}
export function money(n: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
