"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Uploads, UploadImage } from "./uploads";
export function ReviewForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();
  const [images, setImages] = useState<UploadImage[]>([]),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  if (done)
    return (
      <div className="notice" role="status">
        <h3>Thank you for sharing.</h3>
        <p>
          Your review has been submitted for moderation. It will appear publicly
          if approved.
        </p>
      </div>
    );
  return (
    <form
      className="form-card"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          const res = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, image: images[0] }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setDone(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unable to submit review");
        }
      })}
    >
      <div className="form-grid">
        <label className="field">
          Your name *<input required maxLength={100} {...register("name")} />
        </label>
        <label className="field">
          Rating *
          <select {...register("rating")}>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Average</option>
            <option value="2">2 — Below expectations</option>
            <option value="1">1 — Poor</option>
          </select>
        </label>
        <label className="field">
          Vehicle
          <input {...register("vehicle")} />
        </label>
        <label className="field">
          Service used
          <select {...register("transactionType")}>
            {[
              "Vehicle purchase",
              "Preorder",
              "Importation",
              "Shipping",
              "Clearing",
              "Trucking",
              "Inspection",
            ].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="field full">
          Your experience *
          <textarea
            required
            minLength={10}
            maxLength={3000}
            {...register("review")}
          />
        </label>
        <label className="field full">
          Video link (optional)
          <input type="url" {...register("videoUrl")} />
        </label>
        <Uploads value={images} onChange={setImages} review />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="button" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit review ↗"}
        </button>
      </div>
    </form>
  );
}
