import Link from "next/link";
export default function NotFound() {
  return (
    <section className="container section empty">
      <p className="eyebrow">404 / A DIFFERENT ROAD</p>
      <h1>This page isn’t here.</h1>
      <p>The listing may have moved or is no longer published.</p>
      <Link className="button" href="/cars">
        Explore vehicles ↗
      </Link>
    </section>
  );
}
