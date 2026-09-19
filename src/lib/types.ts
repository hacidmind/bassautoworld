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
export function money(n: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
