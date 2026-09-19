import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RequestForm } from "@/components/request-form";
import { WhatsApp } from "@/components/shell";
import { ReviewForm } from "@/components/review-form";
import { settings, reviews, services } from "@/lib/data";
const content: Record<
  string,
  { title: string; eyebrow: string; description: string; type?: string }
> = {
  preorder: {
    title: "Your vision. Our next mission.",
    eyebrow: "BUILT AROUND YOU",
    description:
      "Tell us what you’re looking for. We’ll help source the right vehicle and coordinate its journey to you.",
    type: "PREORDER",
  },
  inspection: {
    title: "Look closer. Choose confidently.",
    eyebrow: "KNOW YOUR NEXT CAR",
    description:
      "Arrange a physical viewing, a mechanic inspection, or a remote video inspection before your next move.",
    type: "INSPECTION",
  },
  contact: {
    title: "Let’s talk about your next move.",
    eyebrow: "A CONVERSATION STARTS IT ALL",
    description:
      "Buying a car, sourcing something special, or moving a vehicle? Tell us what you need.",
    type: "CONTACT",
  },
  about: {
    title: "Your vehicle partner. Worldwide.",
    eyebrow: "MEET BASSAUTOWORLD",
    description:
      "We connect vehicle buyers with possibilities, and help bring those possibilities home.",
  },
  services: {
    title: "Every part of the journey.",
    eyebrow: "FROM SEARCH TO YOUR DRIVEWAY",
    description:
      "Vehicle sourcing, importation, shipping, clearing and delivery. Practical support, from one partner.",
  },
  reviews: {
    title: "Every journey has a story.",
    eyebrow: "CUSTOMER EXPERIENCES",
    description:
      "Read experiences shared by our customers, or tell us about your own journey with BassAutoWorld.",
  },
};
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  return {
    title: content[page]?.title || "Page not found",
    alternates: { canonical: "/" + page },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { page } = await params;
  const c = content[page];
  if (!c) notFound();
  const [s, q] = await Promise.all([settings(), searchParams]);
  return (
    <>
      <div className="page-heading">
        <div className="container">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
        </div>
      </div>
      <section className="section container">
        {c.type ? (
          <div className="form-layout">
            <aside className="form-aside">
              <h3>
                {page === "preorder"
                  ? "A little detail goes a long way."
                  : page === "inspection"
                    ? "Get a better picture."
                    : "We’re here to help."}
              </h3>
              <p>
                {page === "preorder"
                  ? "Share your must-haves, your budget, and your preferred timeline. Our team will review your requirements and discuss the available options with you."
                  : "Complete the form and our team will follow up to discuss your request."}
              </p>
              {page === "inspection" && (
                <p>
                  Your requested date is subject to confirmation. Our team will
                  confirm availability before an inspection is scheduled.
                </p>
              )}
              {s.phone && (
                <p>
                  <a href={"tel:" + s.phone}>{s.phone}</a>
                </p>
              )}
              {s.email && (
                <p>
                  <a href={"mailto:" + s.email}>{s.email}</a>
                </p>
              )}
              {s.address && <p>{s.address}</p>}
              <WhatsApp
                number={s.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
                message={
                  page === "inspection"
                    ? `Hello BassAutoWorld. I would like to schedule an inspection${q.vehicle ? " for vehicle " + q.vehicle : ""}.`
                    : page === "preorder"
                      ? "Hello BassAutoWorld. I would like help sourcing a vehicle."
                      : "Hello BassAutoWorld. I would like to discuss your vehicle sales and logistics services."
                }
              />
            </aside>
            <RequestForm type={c.type} vehicle={q.vehicle} />
          </div>
        ) : page === "services" ? (
          <>
            <div className="car-grid">
              {[
                {
                  slug: "/cars",
                  name: "Car sales",
                  description:
                    "Explore available vehicles and book an inspection.",
                },
                {
                  slug: "/preorder",
                  name: "Vehicle preorder",
                  description:
                    "Tell us your requirements and let us help source your next vehicle.",
                },
                ...services.map((s) => ({ ...s, slug: "/services/" + s.slug })),
              ].map((s) => (
                <Link href={s.slug} key={s.slug} className="form-card">
                  <p className="eyebrow">BASSAUTOWORLD SERVICES</p>
                  <h3>{s.name} ↗</h3>
                  <p>{s.description}</p>
                </Link>
              ))}
            </div>
          </>
        ) : page === "about" ? (
          <div className="form-layout">
            <div>
              <p className="eyebrow">ONE PARTNER. EVERY MILE.</p>
              <h2>
                A clearer path
                <br />
                to your next car.
              </h2>
            </div>
            <div>
              <p>
                {s.description ||
                  "BassAutoWorld helps customers buy, source, import, ship, clear, and deliver vehicles. We bring the different parts of the process together, so you have a partner to discuss your options with at every stage."}
              </p>
              <h3>Local knowledge. Global possibilities.</h3>
              <p>
                From local vehicle sales to international sourcing, our services
                are built around your requirements. We work with shipping
                companies to coordinate vehicle movement, and support clearing,
                forwarding, and trucking.
              </p>
              <h3>Your decision comes first.</h3>
              <p>
                Review vehicle details, arrange an inspection, and ask questions
                before making a commitment. For auction sourcing, we assist with
                independent platforms such as Copart and IAAI; these platforms
                are not owned or operated by BassAutoWorld.
              </p>
              <Link className="button" href="/contact">
                Meet your next vehicle partner ↗
              </Link>
            </div>
          </div>
        ) : (
          <Reviews />
        )}
      </section>
    </>
  );
}
async function Reviews() {
  const entries = await reviews();
  return (
    <>
      <div className="review-grid">
        {entries.length ? (
          entries.map(
            (r: {
              _id: string;
              name: string;
              rating: number;
              review: string;
              vehicle: string;
              image?: { secureUrl: string; alt: string };
              videoUrl?: string;
            }) => (
              <article className="review" key={r._id}>
                <p className="stars" aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}
                </p>
                <p>“{r.review}”</p>
                <strong>{r.name}</strong>
                <p>{r.vehicle}</p>
                {r.image && (
                  <Image
                    src={r.image.secureUrl}
                    alt={
                      r.image.alt || "Customer-submitted experience photograph"
                    }
                    width={600}
                    height={400}
                    sizes="(max-width:760px) 85vw, 30vw"
                    style={{ width: "100%", height: 180, objectFit: "cover" }}
                  />
                )}
                {r.videoUrl && (
                  <a
                    className="text-link"
                    href={r.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Watch customer video ↗
                  </a>
                )}
              </article>
            ),
          )
        ) : (
          <div className="empty">
            <h3>Your story could be the first.</h3>
            <p>
              Published customer experiences will appear here once reviewed by
              our team.
            </p>
          </div>
        )}
      </div>
      <div className="form-layout section">
        <div>
          <p className="eyebrow">BE PART OF THE STORY</p>
          <h2>
            How was
            <br />
            your journey?
          </h2>
          <p>
            Reviews are moderated before publication. Please avoid including
            private contact details or sensitive documents.
          </p>
        </div>
        <ReviewForm />
      </div>
    </>
  );
}
