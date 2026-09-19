import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  Ship,
  ShieldCheck,
  Truck,
  MoveUpRight,
} from "lucide-react";
import { cars, heroImage, services, reviews, settings } from "@/lib/data";
import { CarCard } from "@/components/vehicles";
export const dynamic = "force-dynamic";
export const metadata = {
  alternates: { canonical: "/" },
  openGraph: { images: ["/images/hero.jpg"] },
};
export default async function Home() {
  const [inventory, stories, business] = await Promise.all([
    cars(),
    reviews(),
    settings(),
  ]);
  return (
    <>
      <section className="hero">
        <Image
          src={heroImage}
          alt="Silver sports car on an open road"
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> YOUR VEHICLE PARTNER. WORLDWIDE.
            </p>
            <h1>
              Drive what
              <br />
              you <em>want.</em>
            </h1>
            <h2>We handle the journey.</h2>
            <p className="hero-description">
              From your first search to your final destination.
              <br />
              Buy, source, import, and deliver — all with one partner.
            </p>
            <div className="actions">
              <Link className="button" href="/cars">
                Browse cars <ArrowUpRight size={19} />
              </Link>
              <Link className="button glass" href="/preorder">
                Preorder a vehicle <ArrowUpRight size={19} />
              </Link>
            </div>
          </div>
          <div className="hero-foot">
            <span>BUILT AROUND YOUR NEXT MOVE.</span>
            <span>
              EXPLORE THE POSSIBILITIES <span className="down">↓</span>
            </span>
          </div>
        </div>
        <div className="hero-side">BASSAUTOWORLD / THE ROAD AHEAD</div>
      </section>
      <div className="trust-strip">
        <div className="container trust-items">
          <span>
            <Globe2 /> International sourcing
          </span>
          <span>
            <Ship /> Direct shipping relationships
          </span>
          <span>
            <ShieldCheck /> Clearing & forwarding
          </span>
          <span>
            <Truck /> Delivery coordination
          </span>
        </div>
      </div>
      {business.trustStatement && (
        <p className="container verified-statement">
          {business.trustStatement}
        </p>
      )}
      <section
        className="section container"
        id="featured-cars"
        aria-labelledby="featured-heading"
      >
        <div className="section-head reveal">
          <div>
            <p className="eyebrow">THE RIGHT CAR. THE RIGHT FEELING.</p>
            <h2 id="featured-heading">Featured cars.</h2>
          </div>
          <div>
            <p>
              Explore vehicles available from BassAutoWorld.
              <br />
              Find the one that moves you.
            </p>
            <Link className="text-link" href="/cars">
              Browse all cars <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        {inventory.length ? (
          <div className="car-grid">
            {inventory
              .filter((c) => c.featured)
              .concat(inventory.filter((c) => !c.featured))
              .slice(0, 6)
              .map((c) => (
                <CarCard key={c._id} car={c} />
              ))}
          </div>
        ) : (
          <div className="empty-inventory reveal">
            <div>
              <p className="eyebrow">SOMETHING SPECIFIC IN MIND?</p>
              <h3>Your perfect car is worth finding.</h3>
              <p>
                Our online collection is being prepared. Tell us your
                preferences and we’ll help you explore your options.
              </p>
              <Link href="/preorder" className="text-link">
                Find my next vehicle <ArrowRight size={18} />
              </Link>
            </div>
            <Image
              src="/images/automotive.jpg"
              width={1100}
              height={650}
              alt="Automotive design detail, illustrative photography"
            />
          </div>
        )}
        <div className="inventory-cta reveal">
          <p>More possibilities. Find a car that fits your next move.</p>
          <Link className="button" href="/cars">
            Browse cars <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
      <section className="services-section">
        <div className="container section">
          <div className="section-head reveal">
            <div>
              <p className="eyebrow">ONE PARTNER. EVERY MILE.</p>
              <h2>Beyond the purchase.</h2>
            </div>
            <p>
              From a car across town to a vehicle across the ocean.
              <br />
              We help connect every part of the journey.
            </p>
          </div>
          <div className="service-grid">
            {services.map((s, i) => (
              <Link
                href={"/services/" + s.slug}
                key={s.slug}
                className="service-card reveal"
              >
                <span className="service-num">
                  0{i + 1}
                  <ArrowUpRight size={21} />
                </span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <span className="eyebrow">{s.tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container section process">
        <div className="reveal">
          <p className="eyebrow">A CLEAR ROAD AHEAD</p>
          <h2>
            Big possibilities.
            <br />
            Simple steps.
          </h2>
          <p>
            You choose the destination.
            <br />
            We help take care of the details.
          </p>
          <Link href="/preorder" className="button">
            Start your journey <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="process-list">
          {[
            "Tell us what you want",
            "We source your options",
            "You review and approve",
            "We coordinate purchase & shipping",
            "We handle clearing",
            "You collect. Or we deliver.",
          ].map((t, i) => (
            <div className="process-step reveal" key={t}>
              <span>0{i + 1}</span>
              <h3>{t}</h3>
              <MoveUpRight size={18} />
            </div>
          ))}
        </div>
      </section>
      <section className="stories">
        <div className="container section reveal">
          <p className="eyebrow">TRUST IS EARNED, MILE BY MILE.</p>
          <h2>
            Real journeys.
            <br />
            Real people.
          </h2>
          {stories.length ? (
            <blockquote>
              “{stories[0].review}”<cite>{stories[0].name}</cite>
            </blockquote>
          ) : (
            <p>
              Every vehicle has a story. If we’ve been part of yours,
              <br />
              we’d love to hear about the experience.
            </p>
          )}
          <Link href="/reviews" className="text-link">
            {stories.length ? "Read customer stories" : "Share your experience"}{" "}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="container final-cta">
        <p className="eyebrow">LET’S MAKE YOUR NEXT MOVE.</p>
        <h2>
          The road ahead
          <br />
          starts with a conversation.
        </h2>
        <Link className="button" href="/contact">
          Talk to BassAutoWorld <ArrowUpRight size={19} />
        </Link>
      </section>
    </>
  );
}
