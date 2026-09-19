import { cleanDescription } from "@/lib/description";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cars, settings, money } from "@/lib/data";
import { Gallery } from "@/components/vehicles";
import { WhatsApp } from "@/components/shell";
import { RequestForm } from "@/components/request-form";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const car = (await cars()).find((c) => c.slug === slug);
  return {
    title: car ? `${car.year} ${car.make} ${car.model}` : "Vehicle not found",
    description: car?.description,
    alternates: { canonical: "/cars/" + slug },
    openGraph: { images: car?.images[0] ? [car.images[0].secureUrl] : [] },
  };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [all, s] = await Promise.all([cars(), settings()]);
  const c = all.find((c) => c.slug === slug);
  if (!c) notFound();
  const title = `${c.year} ${c.make} ${c.model} ${c.trim || ""}`;
  return (
    <section className="container section">
      <div className="breadcrumbs">
        <Link href="/cars">Browse cars</Link> / {title}
      </div>
      <div className="detail-grid">
        <Gallery images={c.images} />
        <div className="detail-summary">
          <span className="status">{c.status}</span>
          <h1>{title}</h1>
          <p>
            {c.location} · Stock {c.stockNumber}
          </p>
          <div className="price">{money(c.price, c.currency)}</div>
          <p>
            {c.mileage.toLocaleString()} km · {String(c.transmission || "")} ·{" "}
            {String(c.fuelType || "")}
          </p>
          <div className="actions">
            {c.status === "SOLD" ? (
              <Link
                className="button"
                href={"/preorder?vehicle=" + encodeURIComponent(title)}
              >
                Find something similar ↗
              </Link>
            ) : (
              <>
                <Link
                  className="button"
                  href={
                    "/inspection?vehicle=" + encodeURIComponent(c.stockNumber)
                  }
                >
                  Request inspection ↗
                </Link>
                <WhatsApp
                  number={s.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
                  message={`Hello BassAutoWorld. I am interested in the ${title} listed on your website. Stock ID: ${c.stockNumber}.`}
                  label="WhatsApp about this car"
                />
              </>
            )}
            <Link
              className="text-link"
              href={"/preorder?vehicle=" + encodeURIComponent(title)}
            >
              Preorder something similar ↗
            </Link>
          </div>
        </div>
      </div>
      <div className="detail-grid section">
        <div>
          <h2>A closer look.</h2>
          <div className="rich-description">{c.descriptionHtml ? <div dangerouslySetInnerHTML={{ __html: cleanDescription(String(c.descriptionHtml)) }} /> : <p style={{ whiteSpace: "pre-line" }}>{c.description}</p>}</div>
          <h3>Specifications</h3>
          <dl className="specs">
            {[
              "engine",
              "transmission",
              "drivetrain",
              "fuelType",
              "exteriorColor",
              "interiorColor",
              "vin",
              "stockNumber",
            ].map((k) =>
              c[k] ? (
                <div key={k}>
                  <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{String(c[k])}</dd>
                </div>
              ) : null,
            )}
          </dl>
          <h3 style={{ marginTop: 30 }}>Condition</h3>
          <p>{c.condition}</p>
          <h3>Features</h3>
          <ul>
            {c.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {!!c.instagramUrl && (
            <a
              className="text-link"
              href={String(c.instagramUrl)}
              rel="noreferrer"
              target="_blank"
            >
              Watch on Instagram ↗
            </a>
          )}
        </div>
        <div>
          <h3>Ask about this vehicle</h3>
          <RequestForm type="VEHICLE_INQUIRY" vehicle={c.stockNumber} />
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Car",
            name: title,
            brand: c.make,
            model: c.model,
            vehicleModelDate: String(c.year),
            image: c.images.map((i) => i.secureUrl),
            description: c.description,
          }).replace(/</g, "\u003c"),
        }}
      />
    </section>
  );
}
