import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
test.beforeAll(async () => {
  const connection = await mongoose
    .createConnection("mongodb://127.0.0.1:27028/bassautoworld_qa")
    .asPromise();
  await connection.collection("ratelimits").deleteMany({});
  await connection.close();
});
test.describe.configure({ mode: "serial" });
const stamp = Date.now().toString();
const buyer = "QA Buyer " + stamp;
let vehicleId = "";
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Local-QA-only-2026!");
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
test("public pages, desktop/mobile navigation and images", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /hydration|hydrated/i.test(m.text()))
      errors.push(m.text());
  });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Beyond borders.Behind the wheel.",
    );
    await expect
      .poll(() =>
        page
          .locator(".hero-image")
          .evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await page.waitForLoadState("networkidle");
    // The hero has a persistent paused timeline driven by scroll position.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            (animation.effect as KeyframeEffect)?.target ===
            document.querySelector(".hero-image"),
        ),
    );
    await expect(
      page.getByRole("heading", { name: "Featured cars." }),
    ).toBeVisible();
    await expect(
      page
        .locator("#featured-cars")
        .getByRole("link", { name: "Browse cars", exact: true }),
    ).toHaveAttribute("href", "/cars");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Browse cars" })
    .click();
  await expect(page).toHaveURL(/\/cars$/);
  await page.getByRole("button", { name: "Search & filters" }).click();
  await expect(page.getByLabel("Search vehicles")).toBeVisible();
  for (const route of [
    "/preorder",
    "/inspection",
    "/services",
    "/services/importation",
    "/services/auction-sourcing",
    "/services/shipping",
    "/services/clearing-forwarding",
    "/services/trucking",
    "/reviews",
    "/about",
    "/contact",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("customer contact, inspection, preorder and shipping persist", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("Full name").fill(buyer);
  await page.getByLabel("Phone number").fill("+2348000000000");
  await page.getByLabel("Email address").fill("buyer@example.test");
  await page.getByLabel("Additional notes").fill("QA contact request");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText("Request received.");
  await expect(page.getByRole("status")).toContainText(/BAW-\d{8}-[A-F0-9]{8}/);
  await page.goto("/inspection?vehicle=QA-STOCK");
  await expect(page.getByLabel("Vehicle / stock number")).toHaveValue(
    "QA-STOCK",
  );
  await page.getByLabel("Inspection type").selectOption("Video inspection");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.getByLabel("Preferred date").fill(tomorrow);
  await page.getByLabel("Preferred time").fill("10:00");
  await page.getByLabel("Full name").fill(buyer);
  await page.getByLabel("Phone number").fill("+2348000000000");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText("Request received.");
  await page.goto("/preorder");
  await page.getByLabel("Make *").fill("Toyota");
  await page.getByLabel("Model *").fill("Camry");
  await page.getByLabel("Year from").fill("2020");
  await page.getByLabel("Year to").fill("2023");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("STEP 2 OF 7")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Budget *").fill("15000000");
  await page.getByLabel("Currency").selectOption("NGN");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Title preference").selectOption("Clean title only");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Delivery location").fill("Lagos");
  await page.getByLabel("Preferred timeline").selectOption("Flexible");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill(buyer);
  await page.getByLabel("Phone number").fill("+2348000000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("STEP 7 OF 7")).toBeVisible();
  await expect(page.getByText("Camry", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText("Request received.");
  await page.goto("/services/shipping");
  for (const [label, value] of [
    ["Origin country", "USA"],
    ["Origin port / city", "Houston"],
    ["Destination", "Lagos"],
    ["Vehicle make, model and year", "2021 Toyota Camry"],
    ["Full name", buyer],
    ["Phone number", "+2348000000000"],
  ])
    await page.getByLabel(label).fill(value);
  await page.getByLabel("Vehicle condition").selectOption("Running");
  await page.getByRole("button", { name: "Request a quote" }).click();
  await expect(page.getByRole("status")).toContainText("Request received.");
});
test("admin protects routes and persists lead and inspection status", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  const denied = await request.post("/api/admin/vehicles", {
    headers: { Origin: "http://localhost:3001" },
    data: { make: "Intruder" },
  });
  expect(denied.status()).toBe(401);
  await login(page);
  await page.goto("/admin/leads");
  await expect(page.getByText(buyer, { exact: true })).toHaveCount(4);
  const row = page
    .locator("tr")
    .filter({ hasText: buyer })
    .filter({ hasText: "CONTACT Â· WEBSITE" });
  await row.getByRole("combobox").selectOption("CONTACTED");
  await expect(row.getByRole("combobox")).toBeEnabled();
  await page.reload();
  await expect(
    page
      .locator("tr")
      .filter({ hasText: buyer })
      .filter({ hasText: "CONTACT Â· WEBSITE" })
      .getByRole("combobox"),
  ).toHaveValue("CONTACTED");
  await page.goto("/admin/inspections");
  const inspection = page.locator("tr").filter({ hasText: buyer });
  await inspection.getByLabel("Inspection progress").selectOption("SCHEDULED");
  await expect(inspection.getByLabel("Inspection progress")).toBeEnabled();
  await page.reload();
  await expect(
    page
      .locator("tr")
      .filter({ hasText: buyer })
      .getByLabel("Inspection progress"),
  ).toHaveValue("SCHEDULED");
});
test("reviews stay private until approved and can be hidden", async ({
  page,
}) => {
  await page.goto("/reviews");
  await page.getByLabel("Your name").fill(buyer);
  await page
    .getByLabel("Your experience")
    .fill("This is a QA-only review to verify moderation.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByRole("status")).toContainText(
    "submitted for moderation",
  );
  await page.reload();
  await expect(page.locator(".review-grid")).not.toContainText(buyer);
  await login(page);
  await page.goto("/admin/reviews");
  const row = page.locator("tr").filter({ hasText: buyer });
  await row.getByRole("combobox").selectOption("APPROVED");
  await expect(row.getByRole("combobox")).toBeEnabled();
  await page.goto("/reviews");
  await expect(page.locator(".review-grid")).toContainText(buyer);
  await page.goto("/admin/reviews");
  await page
    .locator("tr")
    .filter({ hasText: buyer })
    .getByRole("combobox")
    .selectOption("HIDDEN");
  await expect(
    page.locator("tr").filter({ hasText: buyer }).getByRole("combobox"),
  ).toBeEnabled();
  await page.goto("/reviews");
  await expect(page.locator(".review-grid")).not.toContainText(buyer);
});
test("admin vehicle create, edit, publication, sold behavior and archive", async ({
  page,
}) => {
  await page.route("**/_next/image?url=https*", async (route) =>
    route.fulfill({
      contentType: "image/jpeg",
      body: await readFile(route.request().url().includes("qa-fixture-2")
        ? "public/images/automotive.jpg" : "public/images/hero.jpg"),
    }),
  );
  await login(page);
  await page.goto("/admin/vehicles/new");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Show on the website")).toBeChecked();
  for (const [label, value] of [
    ["Make (e.g. Toyota) *", "Toyota"],
    ["Model (e.g. Camry) *", "Camry"],
    ["Year *", "2021"],
    ["Price *", "15000000"],
    ["Vehicle location *", "QA only"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByLabel("Vehicle description *")
    .fill(
      "A clean vehicle with a comfortable interior and full service history.",
    );
  await page.getByRole("button", { name: "Save vehicle" }).click();
  await expect(
    page.locator(".vehicle-editor").getByRole("alert"),
  ).toContainText("Add at least one photo");
  // Only the external media service is stubbed; saving and reading use the real local API/database.
  await page.route("**/api/uploads", (route) =>
    route.fulfill({
      json: {
        params: {},
        cloudName: "demo",
        apiKey: "qa",
        signature: "qa",
      },
    }),
  );
  let uploadCount = 0;
  await page.route("https://api.cloudinary.com/**", async (route) => {
    const uploadId = ++uploadCount;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      json: {
        public_id: "qa-fixture-" + uploadId,
        secure_url: `https://res.cloudinary.com/demo/image/upload/qa-fixture-${uploadId}.jpg`,
        width: 864,
        height: 576,
        format: "jpg",
      },
    });
  });
  await page
    .locator('input[type="file"]')
    .setInputFiles("public/images/hero.jpg");
  await expect(
    page.getByRole("button", { name: "Uploading photos..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save vehicle" }),
  ).toBeEnabled();
  await page
    .getByLabel("Add photos from URLs")
    .fill("https://example.com/vehicle.avif\nhttps://example.com/second.jpg\nhttps://example.com/vehicle.avif");
  await page.getByRole("button", { name: "Save vehicle" }).click();
  await expect(page.locator(".vehicle-editor").getByRole("alert")).toContainText("Some photo URLs have not been uploaded");
  await page.getByRole("button", { name: "Add photos from URLs" }).click();
  await expect(page.locator(".photo-tile")).toHaveCount(3);
  await expect.poll(() => page.locator(".photo-tile img").evaluateAll(
    (images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
  )).toBe(true);
  await expect(page.getByLabel("Add photos from URLs")).toHaveValue("");
  await page.getByLabel("Vehicle description *").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await page.getByRole("button", { name: "Underline", exact: true }).click();
  await page.getByLabel("Text style").selectOption("h2");
  await page.screenshot({
    path: "test-results/vehicle-editor-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/vehicles") &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save vehicle" }).click();
  const created = await (await responsePromise).json();
  vehicleId = created.id;
  expect(created.slug).toMatch(/^2021-toyota-camry-/);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/vehicles/" + vehicleId);
  await expect(page.locator(".photo-tile img").nth(1)).toHaveAttribute("src", /qa-fixture-2/);
  await expect(page.locator(".photo-tile img").nth(2)).toHaveAttribute("src", /qa-fixture-3/);
  await expect(page.getByLabel("Vehicle description *")).toHaveText(
    "A clean vehicle with a comfortable interior and full service history.",
  );
  await expect(page.locator(".description-input h2 strong u")).toBeVisible();
  await page
    .getByLabel("Vehicle description *")
    .fill("Updated description after an inspection.");
  await page.getByRole("button", { name: "Quote", exact: true }).click();
  await page.getByRole("button", { name: "Save vehicle" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/cars");
  await expect(page.locator(".car-description")).toContainText(
    "Updated description after an inspection.",
  );
  await page.goto("/cars/" + created.slug);
  await expect(page.locator("h1")).toContainText("2021 Toyota Camry");
  await expect(page.locator(".rich-description blockquote")).toContainText(
    "Updated description after an inspection.",
  );
  await expect(
    page.getByRole("link", { name: "Request inspection" }),
  ).toBeVisible();
  await expect(page.locator(".gallery-thumbs button")).toHaveCount(3);
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(page.locator(".gallery-count")).toHaveText("2 / 3");
  await expect(page.locator(".gallery-main img")).toHaveAttribute("src", /qa-fixture-2/);
  await expect.poll(() => page.locator(".gallery-main img").evaluate(
    (image) => (image as HTMLImageElement).naturalWidth,
  )).toBeGreaterThan(0);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.locator(".gallery-main img").evaluate(
      (image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
    )).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    const stage = await page.locator(".gallery-stage").boundingBox();
    const thumbnails = await page.locator(".gallery-thumbs").boundingBox();
    expect(thumbnails!.y).toBeGreaterThanOrEqual(stage!.y + stage!.height);
    expect(Math.abs(thumbnails!.x - stage!.x)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/gallery-${width}.png` });
  }
  await page
    .getByRole("button", { name: "Open photo 2 of 3 full screen" })
    .click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await page.request.patch("/api/admin/vehicles", {
    headers: { Origin: "http://localhost:3001" },
    data: { id: vehicleId, status: "SOLD" },
  });
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Find something similar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request inspection" }),
  ).toHaveCount(0);
  await page.request.patch("/api/admin/vehicles", {
    headers: { Origin: "http://localhost:3001" },
    data: { id: vehicleId, archived: true },
  });
  const response = await page.goto("/cars/" + created.slug);
  await expect(page.getByRole("heading", { name: /This page/ })).toBeVisible();
  await page.goto("/admin");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".admin-header").getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/admin-signout-${width}.png` });
  }
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
