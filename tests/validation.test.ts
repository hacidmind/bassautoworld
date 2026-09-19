import test from "node:test";
import assert from "node:assert/strict";
import {
  requestSchema,
  vehicleSchema,
  reviewSchema,
} from "../src/lib/validation";
const contact = {
  type: "CONTACT",
  name: "Test Buyer",
  phone: "+234 800 000 0000",
  email: "buyer@example.com",
  details: { notes: "A test request" },
};
test("valid contact strips unexpected administrative fields", () => {
  const result = requestSchema.parse({
    ...contact,
    status: "WON",
    role: "SUPER_ADMIN",
  });
  assert.equal("status" in result, false);
  assert.equal("role" in result, false);
});
test("rejects honeypot and malformed contact data", () => {
  assert.equal(
    requestSchema.safeParse({ ...contact, website: "spam" }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({ ...contact, phone: "invalid!" }).success,
    false,
  );
});
test("preorder requires vehicle, budget and destination", () => {
  assert.equal(
    requestSchema.safeParse({ ...contact, type: "PREORDER" }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      ...contact,
      type: "PREORDER",
      details: {
        make: "Toyota",
        model: "Camry",
        yearFrom: "2020",
        yearTo: "2023",
        budget: "10000000",
        currency: "NGN",
        delivery: "Lagos",
        timeline: "Flexible",
      },
    }).success,
    true,
  );
});
test("rejects inverted preorder years and negative budgets", () => {
  assert.equal(
    requestSchema.safeParse({
      ...contact,
      type: "PREORDER",
      details: {
        make: "Toyota",
        model: "Camry",
        yearFrom: "2025",
        yearTo: "2020",
        budget: "-1",
        currency: "NGN",
        delivery: "Lagos",
        timeline: "Flexible",
      },
    }).success,
    false,
  );
});
test("inspection requires vehicle and future date", () => {
  assert.equal(
    requestSchema.safeParse({
      ...contact,
      type: "INSPECTION",
      vehicle: "BAW-1",
      details: {
        inspectionType: "Video inspection",
        date: "2001-01-01",
        time: "10:00",
      },
    }).success,
    false,
  );
});
test("review cannot set moderation state or inject non-HTTPS media", () => {
  const review = {
    name: "Buyer",
    rating: 5,
    review: "Great communication during my purchase.",
    vehicle: "Camry",
    transactionType: "Purchase",
    status: "APPROVED",
  };
  assert.equal("status" in reviewSchema.parse(review), false);
  assert.equal(
    reviewSchema.safeParse({ ...review, videoUrl: "javascript:alert(1)" })
      .success,
    false,
  );
});
test("publishing vehicle requires Cloudinary image", () => {
  const v = {
    slug: "toyota-camry",
    stockNumber: "BAW-1",
    make: "Toyota",
    model: "Camry",
    year: 2021,
    price: 100,
    mileage: 0,
    location: "Lagos",
    status: "AVAILABLE",
    published: true,
    featured: false,
  };
  assert.equal(vehicleSchema.safeParse(v).success, false);
  assert.equal(
    vehicleSchema.safeParse({ ...v, published: false }).success,
    true,
  );
});
test("blank optional URLs are accepted and malformed URLs never throw", () => {
  const review = {
    name: "Buyer",
    rating: 5,
    review: "A detailed customer experience.",
    vehicle: "",
    transactionType: "Purchase",
  };
  assert.equal(
    reviewSchema.safeParse({ ...review, videoUrl: "" }).success,
    true,
  );
  assert.equal(
    reviewSchema.safeParse({ ...review, videoUrl: "not-a-url" }).success,
    false,
  );
});
