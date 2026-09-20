"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Car, money } from "@/lib/types";
export function CarCard({ car }: { car: Car }) {
  return (
    <Link href={"/cars/" + car.slug} className="car-card">
      <div className="car-image">
        {car.images[0] && (
          <Image
            src={car.images[0].secureUrl}
            alt={car.images[0].alt || `${car.year} ${car.make} ${car.model}`}
            fill
            sizes="(max-width:760px) 90vw, 30vw"
          />
        )}
        <span className="status">{car.status}</span>
      </div>
      <div className="car-info">
        <h3>
          {car.year} {car.make} {car.model}
        </h3>
        <p>
          {car.trim} · {car.mileage.toLocaleString()} km · {car.location}
        </p>
        {car.description && (
          <p className="car-description">{car.description}</p>
        )}
        <div className="car-price">
          <span>{money(car.price, car.currency)}</span>
          <ArrowUpRight size={20} />
        </div>
      </div>
    </Link>
  );
}
export function Marketplace({ cars }: { cars: Car[] }) {
  const [query, setQuery] = useState(""),
    [make, setMake] = useState(""),
    [model, setModel] = useState(""),
    [year, setYear] = useState(""),
    [price, setPrice] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("newest"),
    [currency, setCurrency] = useState("NGN"),
    [show, setShow] = useState(false),
    [page, setPage] = useState(1);
  const filterPanel = useRef<HTMLDivElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!show || !window.matchMedia("(max-width:760px)").matches) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    filterPanel.current?.querySelector<HTMLElement>("button,input")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShow(false);
      if (event.key === "Tab") {
        const elements = Array.from(
          filterPanel.current?.querySelectorAll<HTMLElement>(
            "button,input,select",
          ) || [],
        );
        const first = elements[0],
          last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", key);
      filterTrigger.current?.focus();
    };
  }, [show]);
  const filtered = cars
    .filter(
      (c) =>
        `${c.make} ${c.model} ${c.trim} ${c.stockNumber}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!make || c.make === make) &&
        (!model || c.model === model) &&
        c.currency === currency &&
        (!year || String(c.year) === year) &&
        (!price || c.price <= Number(price)) &&
        (!status || c.status === status),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "year"
            ? b.year - a.year
            : 0,
    );
  function reset() {
    setQuery("");
    setMake("");
    setModel("");
    setYear("");
    setPrice("");
    setStatus("");
    setSort("newest");
    setCurrency("NGN");
    setPage(1);
  }
  return (
    <>
      <button
        ref={filterTrigger}
        className="button outline mobile-filter"
        onClick={() => setShow(!show)}
        aria-expanded={show}
        aria-controls="vehicle-filters"
      >
        <SlidersHorizontal size={16} /> Search & filters
      </button>
      {show && (
        <button
          className="filter-backdrop"
          aria-label="Close filters"
          onClick={() => setShow(false)}
        />
      )}
      <div
        ref={filterPanel}
        id="vehicle-filters"
        role={show ? "dialog" : undefined}
        aria-modal={show || undefined}
        aria-label={show ? "Vehicle filters" : undefined}
        className={"filters market-filters " + (show ? "show" : "")}
      >
        <div className="filter-drawer-head">
          <h3>Find your vehicle</h3>
          <button
            aria-label="Close filter drawer"
            onClick={() => setShow(false)}
          >
            <X />
          </button>
        </div>
        <input
          aria-label="Search vehicles"
          placeholder="Search make, model, stock…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        {[
          ["Make", make, Array.from(new Set(cars.map((c) => c.make))), setMake],
          [
            "Model",
            model,
            Array.from(
              new Set(
                cars
                  .filter((c) => !make || c.make === make)
                  .map((c) => c.model),
              ),
            ),
            setModel,
          ],
          [
            "Year",
            year,
            Array.from(new Set(cars.map((c) => String(c.year))))
              .sort()
              .reverse(),
            setYear,
          ],
          [
            "Availability",
            status,
            ["AVAILABLE", "RESERVED", "SOLD", "INCOMING"],
            setStatus,
          ],
        ].map(([label, value, options, set]) => (
          <select
            key={label as string}
            aria-label={label as string}
            value={value as string}
            onChange={(e) => {
              (set as (v: string) => void)(e.target.value);
              if (label === "Make") setModel("");
              setPage(1);
            }}
          >
            <option value="">All {String(label).toLowerCase()}</option>
            {(options as string[]).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ))}
        <input
          aria-label={`Maximum price in ${currency}`}
          type="number"
          min="0"
          placeholder={`Max price (${currency})`}
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Price currency"
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            setPage(1);
          }}
        >
          {["NGN", "USD", "GBP", "EUR"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Sort vehicles"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="year">Newest year</option>
        </select>
        <button className="text-link" onClick={reset}>
          Reset
        </button>
        <button className="button filter-apply" onClick={() => setShow(false)}>
          Show {filtered.length} vehicles
        </button>
      </div>
      <p>
        {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
      </p>
      <div className="car-grid">
        {filtered.slice((page - 1) * 12, page * 12).map((c) => (
          <CarCard key={c._id} car={c} />
        ))}
        {!filtered.length && (
          <div className="empty">
            <h3>
              {cars.length
                ? "No matching vehicles"
                : "Your next car is out there."}
            </h3>
            <p>
              {cars.length
                ? "Try adjusting your filters, or let us source a vehicle for you."
                : "Our online inventory is being prepared. Tell us what you’re looking for."}
            </p>
            <Link href="/preorder" className="button">
              Preorder a vehicle <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </div>
      {filtered.length > 12 && (
        <div className="actions">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(filtered.length / 12)}
          </span>
          <button
            disabled={page * 12 >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
export function Gallery({ images }: { images: Car["images"] }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef(0);
  const swiped = useRef(false);
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([]);
  function move(d: number) {
    setIndex((i) => (i + d + images.length) % images.length);
  }
  useEffect(() => {
    const thumbnail = thumbnails.current[index];
    const strip = thumbnail?.parentElement;
    if (!thumbnail || !strip) return;
    strip.scrollTo({
      left: thumbnail.offsetLeft - strip.clientWidth / 2 + thumbnail.clientWidth / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [index]);
  if (!images.length)
    return <div className="empty">Vehicle photos coming soon.</div>;
  return (
    <div className="vehicle-gallery" role="region" aria-label="Vehicle photos">
      <div
        className="gallery-stage"
        onTouchStart={(e) => {
          start.current = e.touches[0].clientX;
          swiped.current = false;
        }}
        onTouchEnd={(e) => {
          const delta = e.changedTouches[0].clientX - start.current;
          if (Math.abs(delta) > 40 && images.length > 1) {
            swiped.current = true;
            move(delta > 0 ? -1 : 1);
          }
        }}
      >
        <button
          type="button"
          className="gallery-main"
          aria-label={`Open photo ${index + 1} of ${images.length} full screen`}
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            dialog.current?.showModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" && images.length > 1) move(-1);
            if (e.key === "ArrowRight" && images.length > 1) move(1);
          }}
        >
          <Image
            src={images[index].secureUrl}
            alt={images[index].alt || "Vehicle photograph"}
            fill
            priority
            sizes="(max-width:760px) 90vw, 55vw"
          />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow previous"
              aria-label="Previous photo"
              onClick={() => move(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gallery-arrow next"
              aria-label="Next photo"
              onClick={() => move(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <span className="gallery-count" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      <div className="gallery-thumbs">
        {images.map((im, i) => (
          <button
            type="button"
            key={im.publicId || i}
            ref={(node) => {
              thumbnails.current[i] = node;
            }}
            onClick={() => setIndex(i)}
            className={i === index ? "selected" : ""}
            aria-label={`View photo ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
          >
            <Image
              src={im.secureUrl}
              alt={im.alt || "Vehicle thumbnail"}
              fill
              sizes="90px"
            />
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="lightbox"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(-1);
          if (e.key === "ArrowRight") move(1);
        }}
      >
        <div className="lightbox-controls">
          <button type="button" aria-label="Previous image" onClick={() => move(-1)}>
            <ChevronLeft />
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button type="button" aria-label="Next image" onClick={() => move(1)}>
            <ChevronRight />
          </button>
          <button
            type="button"
            aria-label="Close viewer"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <div
          className="lightbox-image"
          onTouchStart={(e) => {
            start.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const delta = e.changedTouches[0].clientX - start.current;
            if (Math.abs(delta) > 40) move(delta > 0 ? -1 : 1);
          }}
        >
          <Image
            src={images[index].secureUrl}
            alt={images[index].alt || "Vehicle photograph"}
            fill
            sizes="95vw"
          />
        </div>
      </dialog>
    </div>
  );
}
