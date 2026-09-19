"use client";
import { useState } from "react";
import Image from "next/image";
export type UploadImage = {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  alt: string;
  sortOrder: number;
};
export function Uploads({
  value,
  onChange,
  review = false,
  onBusyChange,
}: {
  value: UploadImage[];
  onChange: (v: UploadImage[]) => void;
  review?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="wide photo-upload">
      <label className="field">
        {review ? "Add a photo (optional)" : "Choose vehicle photos"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple={!review}
          disabled={busy}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            const input = e.currentTarget;
            setBusy(true);
            onBusyChange?.(true);
            setError("");
            const uploaded = [...value];
            try {
              if (files.length + value.length > (review ? 1 : 30))
                throw new Error(
                  review
                    ? "Only one review photo is allowed."
                    : "Maximum 30 images.",
                );
              for (const file of files) {
                setProgress(
                  `Uploading photo ${files.indexOf(file) + 1} of ${files.length}...`,
                );
                if (!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))
                  throw new Error(
                    `${file.name}: choose a JPG, PNG, WebP or HEIC photo.`,
                  );
                if (file.size > 15 * 1024 * 1024)
                  throw new Error("Each image must be under 15 MB.");
                const sign = await fetch("/api/uploads", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ review }),
                });
                const signature = await sign.json();
                if (!sign.ok) throw new Error(signature.error);
                const form = new FormData();
                form.set("file", file);
                for (const [k, v] of Object.entries(signature.params))
                  form.set(k, String(v));
                form.set("api_key", signature.apiKey);
                form.set("signature", signature.signature);
                const res = await fetch(
                  `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
                  { method: "POST", body: form },
                );
                const data = await res.json();
                if (!res.ok)
                  throw new Error(data.error?.message || "Upload failed");
                uploaded.push({
                  publicId: data.public_id,
                  secureUrl: data.secure_url,
                  width: data.width,
                  height: data.height,
                  format: data.format,
                  alt: file.name.replace(/\.[^.]+$/, "").slice(0, 250),
                  sortOrder: uploaded.length,
                });
                onChange([...uploaded]);
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Upload failed");
            } finally {
              setBusy(false);
              onBusyChange?.(false);
              input.value = "";
            }
          }}
        />
      </label>
      <p className="muted">
        {review ? "One photo" : "Up to 30 photos"}, 15 MB each. JPG, PNG, WebP
        or HEIC. Photos upload here automatically.
      </p>
      {busy && <p role="status">{progress} Keep this page open.</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="upload-grid">
        {value.map((im, i) => (
          <div key={im.publicId} className="photo-tile">
            <span className="photo-label">
              {i === 0 ? "Cover photo" : `Photo ${i + 1}`}
            </span>
            <Image src={im.secureUrl} width={160} height={110} alt={im.alt} />
            <label className="field">
              Photo description
              <input
                disabled={busy}
                maxLength={250}
                value={im.alt}
                onChange={(e) =>
                  onChange(
                    value.map((x, j) =>
                      j === i ? { ...x, alt: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <div className="row-actions">
              {i > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const next = [...value];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    onChange(next.map((x, j) => ({ ...x, sortOrder: j })));
                  }}
                >
                  Move left
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onChange(
                    [im, ...value.filter((_, j) => j !== i)].map((x, j) => ({
                      ...x,
                      sortOrder: j,
                    })),
                  )
                }
              >
                {i === 0 ? "Cover photo" : "Set cover"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onChange(
                    value
                      .filter((_, j) => j !== i)
                      .map((x, j) => ({ ...x, sortOrder: j })),
                  )
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
