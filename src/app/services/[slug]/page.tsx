import { notFound } from "next/navigation";
import { services } from "@/lib/data";
import { RequestForm } from "@/components/request-form";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: services.find((s) => s.slug === slug)?.name,
    alternates: { canonical: "/services/" + slug },
  };
}
export default async function Service({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  const types: Record<string, string> = {
    importation: "IMPORTATION",
    "auction-sourcing": "AUCTION_SOURCING",
    shipping: "SHIPPING",
    "clearing-forwarding": "CLEARING",
    trucking: "TRUCKING",
  };
  return (
    <>
      <div className="page-heading">
        <div className="container">
          <p className="eyebrow">{s.tag}</p>
          <h1>{s.name}.</h1>
          <p>{s.description}</p>
        </div>
      </div>
      <section className="container section form-layout">
        <div>
          <h2>
            Let’s work
            <br />
            out the details.
          </h2>
          <p>
            Share your requirements and our team will follow up to discuss
            options, timing and a tailored quote.
          </p>
          <p>
            Pricing and timelines depend on your vehicle, route, and service
            requirements. We’ll confirm the details with you.
          </p>
          {slug === "auction-sourcing" && (
            <p>
              Copart and IAAI are independent auction platforms. BassAutoWorld
              provides sourcing assistance; we are not affiliated with or owners
              of these platforms.
            </p>
          )}
        </div>
        <RequestForm type={types[slug]} serviceLabel="Request a quote" />
      </section>
    </>
  );
}
