import { cars } from "@/lib/data";
import { Marketplace } from "@/components/vehicles";
export const metadata = {
  title: "Browse cars",
  alternates: { canonical: "/cars" },
};
export const dynamic = "force-dynamic";
export default async function Cars() {
  return (
    <>
      <div className="page-heading">
        <div className="container">
          <p className="eyebrow">FIND YOUR NEXT MOVE</p>
          <h1>A car that feels like you.</h1>
          <p>
            Explore our collection, look closer, and let’s talk about the one
            that catches your eye.
          </p>
        </div>
      </div>
      <section className="container section">
        <Marketplace cars={await cars()} />
      </section>
    </>
  );
}
