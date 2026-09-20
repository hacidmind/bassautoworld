"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Uploads, UploadImage } from "./uploads";
import { DescriptionEditor } from "./description-editor";
import { leadStatuses } from "@/lib/validation";
type Row = Record<string, any>;
async function save(section: string, data: Row, id?: string) {
  const res = await fetch("/api/admin/" + section, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Unable to save");
  return result;
}
export function AdminList({
  section,
  initial,
}: {
  section: string;
  initial: Row[];
}) {
  const [rows, setRows] = useState(initial),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState("");
  const kind =
    section === "vehicles"
      ? "vehicles"
      : section === "reviews"
        ? "reviews"
        : "leads";
  async function update(id: string, data: Row) {
    setError("");
    setBusy(id);
    try {
      await save(kind, data, id);
      setRows(rows.map((r) => (r._id === id ? { ...r, ...data } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy("");
    }
  }
  const statuses =
    kind === "vehicles"
      ? ["AVAILABLE", "RESERVED", "SOLD", "INCOMING"]
      : kind === "reviews"
        ? ["PENDING", "APPROVED", "REJECTED", "HIDDEN"]
        : [...leadStatuses];
  return (
    <>
      <div className="section-head">
        <h3>{section.replaceAll("-", " ").toUpperCase()}</h3>
        {kind === "vehicles" && (
          <Link className="button" href="/admin/vehicles/new">
            Add vehicle +
          </Link>
        )}
      </div>
      <div className="filters show">
        <input
          aria-label="Search records"
          placeholder="Search name, stock or reference"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{kind === "vehicles" ? "Vehicle" : "Customer"}</th>
              <th>Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter(
                (r) =>
                  (!status || r.status === status) &&
                  JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
              )
              .map((r) => (
                <tr key={r._id}>
                  <td>
                    <strong>
                      {kind === "vehicles"
                        ? `${r.year} ${r.make} ${r.model}`
                        : r.name}
                    </strong>
                    <p>{r.stockNumber || r.reference}</p>
                    {r.phone && <a href={"tel:" + r.phone}>{r.phone}</a>}
                    {r.email && (
                      <p>
                        <a href={"mailto:" + r.email}>{r.email}</a>
                      </p>
                    )}
                  </td>
                  <td>
                    {kind === "vehicles" ? (
                      <>
                        <p>
                          {r.published ? "Published" : "Draft"}
                          {r.archived ? " · Archived" : ""}
                        </p>
                        <p>{r.location}</p>
                      </>
                    ) : kind === "reviews" ? (
                      <>
                        <p>
                          {r.rating}/5 · {r.vehicle}
                        </p>
                        <p>{r.review}</p>
                        {r.image && (
                          <a
                            href={r.image.secureUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View photo ↗
                          </a>
                        )}
                        {r.videoUrl && (
                          <p>
                            <a
                              href={r.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View video ↗
                            </a>
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          {r.type} · {r.source}
                        </p>
                        <p>{r.vehicle}</p>
                        <details>
                          <summary>Request details</summary>
                          <dl>
                            {Object.entries(r.details || {}).map(([k, v]) => (
                              <div key={k}>
                                <dt>
                                  <strong>{k}</strong>
                                </dt>
                                <dd>{String(v)}</dd>
                              </div>
                            ))}
                          </dl>
                          <p>
                            Referral:{" "}
                            {r.referralCode || r.referrerName || "None"}
                          </p>
                        </details>
                      </>
                    )}
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${r.name || r.stockNumber}`}
                      disabled={busy === r._id}
                      value={r.status}
                      onChange={(e) =>
                        update(r._id, { status: e.target.value })
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    {section === "inspections" && (
                      <label className="field" style={{ marginTop: 15 }}>
                        Inspection progress
                        <select
                          value={r.inspectionStatus || "NEW"}
                          disabled={busy === r._id}
                          onChange={(e) =>
                            update(r._id, { inspectionStatus: e.target.value })
                          }
                        >
                          {[
                            "NEW",
                            "CONTACTED",
                            "SCHEDULED",
                            "COMPLETED",
                            "CANCELLED",
                            "CLOSED",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </td>
                  <td>
                    {kind === "vehicles" ? (
                      <>
                        <Link
                          className="text-link"
                          href={"/admin/vehicles/" + r._id}
                        >
                          Edit vehicle
                        </Link>
                        <p>
                          <Link href={"/cars/" + r.slug}>View listing ↗</Link>
                        </p>
                        <button
                          onClick={() =>
                            update(r._id, { archived: !r.archived })
                          }
                          disabled={busy === r._id}
                        >
                          {r.archived ? "Restore" : "Archive"}
                        </button>
                      </>
                    ) : kind === "reviews" ? (
                      <button
                        disabled={busy === r._id}
                        onClick={() => update(r._id, { featured: !r.featured })}
                      >
                        {r.featured ? "Unfeature" : "Feature"}
                      </button>
                    ) : (
                      <span>
                        {new Date(r.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">No records yet.</div>}
      </div>
      <p className="muted">Showing up to 200 most recent records.</p>
    </>
  );
}
export function VehicleEditor({ initial }: { initial?: Row }) {
  const router = useRouter();
  const [images, setImages] = useState<UploadImage[]>(initial?.images || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{
    slug: string;
    published: boolean;
  } | null>(null);
  const [recordId, setRecordId] = useState<string | undefined>(initial?._id);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Row>({
    defaultValues: initial
      ? { ...initial, features: (initial.features || []).join("\n") }
      : {
          status: "AVAILABLE",
          currency: "NGN",
          published: true,
          featured: false,
          mileage: 0,
          price: 0,
        },
  });
  const published = watch("published");
  const field = (
    key: string,
    label: string,
    required = false,
    type = "text",
  ) => (
    <label className="field" key={key}>
      {label}
      {required ? " *" : ""}
      <input
        type={type}
        required={required}
        min={type === "number" ? (key === "year" ? 1900 : 0) : undefined}
        max={key === "year" ? new Date().getFullYear() + 2 : undefined}
        {...register(key)}
      />
    </label>
  );
  return (
    <form
      className="form-card vehicle-editor"
      onChange={() => setSaved(null)}
      onSubmit={handleSubmit(async (values) => {
        if (uploading) return;
        setError("");
        setSaved(null);
        if (values.published && !images.length) {
          setError("Add at least one photo before saving to the website.");
          return;
        }
        if (!String(values.description || "").trim()) {
          setError("Write a vehicle description before saving.");
          return;
        }
        try {
          const result = await save(
            "vehicles",
            {
              ...values,
              images,
              features: String(values.features || "")
                .split("\n")
                .map((x) => x.trim())
                .filter(Boolean),
            },
            recordId,
          );
          setRecordId(result.id);
          setSaved({
            slug: result.slug,
            published: values.published && !values.archived,
          });
          router.replace("/admin");
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Save failed. Your changes are still here; please try again.",
          );
        }
      })}
    >
      <div className="section-head">
        <div>
          <h3>{recordId ? "Edit vehicle" : "Add a vehicle"}</h3>
          <p className="muted">
            Add photos, tell buyers about the vehicle, then save. You can change
            anything later.
          </p>
        </div>
        <Link href="/admin/vehicles" className="text-link">
          Back to vehicles
        </Link>
      </div>
      <fieldset disabled={isSubmitting} className="editor-fields">
        <section className="editor-section">
          <h4>1. Add your photos</h4>
          <p>
            Choose photos from your phone or computer. The cover photo appears
            first on your website.
          </p>
          <Uploads
            value={images}
            onChange={(v) => {
              setImages(v);
              setError("");
              setSaved(null);
            }}
            onBusyChange={setUploading}
          />
        </section>
        <section className="editor-section">
          <h4>2. Tell buyers about the vehicle</h4>
          <p className="muted">Fields marked * are required.</p>
          <div className="form-grid">
            {field("make", "Make (e.g. Toyota)", true)}
            {field("model", "Model (e.g. Camry)", true)}
            {field("year", "Year", true, "number")}
            {field("location", "Vehicle location", true)}
            {field("price", "Price", true, "number")}
            <label className="field">
              Currency
              <select {...register("currency")}>
                {["NGN", "USD", "GBP", "EUR"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <DescriptionEditor
              html={initial?.descriptionHtml}
              text={initial?.description || ""}
              disabled={isSubmitting}
              onChange={(html, text) => {
                setValue("descriptionHtml", html, { shouldDirty: true });
                setValue("description", text, { shouldDirty: true });
                setSaved(null);
              }}
            />{" "}
          </div>
        </section>
        <details className="editor-section">
          <summary>More vehicle details (optional)</summary>
          <div className="form-grid">
            {field("mileage", "Mileage (km)", false, "number")}
            {[
              ["trim", "Trim"],
              ["engine", "Engine"],
              ["transmission", "Transmission"],
              ["drivetrain", "Drivetrain"],
              ["fuelType", "Fuel type"],
              ["exteriorColor", "Exterior colour"],
              ["interiorColor", "Interior colour"],
              ["vin", "VIN"],
            ].map(([k, l]) => field(k, l))}
            {field("instagramUrl", "Instagram link", false, "url")}
            <label className="field full">
              Condition notes
              <textarea {...register("condition")} />
            </label>
            <label className="field full">
              Features (one per line)
              <textarea {...register("features")} />
            </label>
          </div>
        </details>
        <section className="editor-section">
          <h4>3. Save your listing</h4>
          <label className="field">
            Availability
            <select {...register("status")}>
              {["AVAILABLE", "RESERVED", "SOLD", "INCOMING"].map((x) => (
                <option key={x} value={x}>
                  {x.charAt(0) + x.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" {...register("published")} /> Show on the
            website
          </label>
          <label className="check">
            <input type="checkbox" {...register("featured")} /> Also feature on
            the homepage
          </label>
          {initial?.archived && (
            <label className="check">
              <input type="checkbox" {...register("archived")} /> Archived
              (hidden from the website)
            </label>
          )}
          <p className="muted">
            {published
              ? "Saving makes this listing and your changes visible to buyers, unless archived."
              : "This listing will be saved as a draft, hidden from buyers."}
          </p>
        </section>
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="notice" role="status">
          {saved.published
            ? "Saved. Your vehicle is now on the website. "
            : "Saved. This vehicle is hidden from the website. "}
          {saved.published && (
            <Link href={"/cars/" + saved.slug}>View listing</Link>
          )}
        </p>
      )}
      <div className="actions editor-save">
        <button className="button" disabled={isSubmitting || uploading}>
          {uploading
            ? "Uploading photos..."
            : isSubmitting
              ? "Saving..."
              : "Save vehicle"}
        </button>
        <span className="muted">
          {images.length} photo{images.length === 1 ? "" : "s"} added
        </span>
      </div>
    </form>
  );
}
export function SettingsForm({ initial }: { initial: Row }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Row>({ defaultValues: initial });
  const [message, setMessage] = useState("");
  return (
    <form
      className="form-card"
      onSubmit={handleSubmit(async (values) => {
        try {
          await save("settings", values);
          setMessage("Settings saved.");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Save failed");
        }
      })}
    >
      <h3>Business details</h3>
      <div className="form-grid">
        {[
          "phone",
          "whatsapp",
          "email",
          "address",
          "instagram",
          "facebook",
          "tiktok",
          "logoUrl",
        ].map((k) => (
          <label className="field" key={k}>
            {k}
            <input
              type={
                ["instagram", "facebook", "tiktok", "logoUrl"].includes(k)
                  ? "url"
                  : k === "email"
                    ? "email"
                    : "text"
              }
              {...register(k)}
            />
          </label>
        ))}
        <label className="field full">
          Company description
          <textarea {...register("description")} />
        </label>
        <label className="field full">
          Verified trust statement (only publish substantiated information)
          <textarea {...register("trustStatement")} />
        </label>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="actions">
        <button className="button" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
