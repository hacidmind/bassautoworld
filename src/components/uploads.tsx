"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { parseImageUrls, runUploadBatch, uploadPhoto } from "@/lib/upload-client";
export type UploadImage = {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  alt: string;
  sortOrder: number;
};

export function Uploads({ value, onChange, review = false, onBusyChange }: {
  value: UploadImage[]; onChange: (v: UploadImage[]) => void; review?: boolean; onBusyChange?: (busy: boolean) => void;
}) {
  const [imageUrls, setImageUrls] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<{ source: File | string; message: string }[]>([]);
  const running = useRef(false);
  async function upload(sources: (File | string)[], urls = false) {
    if (running.current || !sources.length) return;
    setError("");
    if (sources.length + value.length > (review ? 1 : 30)) {
      setError(review ? "Only one review photo is allowed." : "You can add " + (30 - value.length) + " more photos. Remove some URLs or photos and try again."); return;
    }
    running.current = true; setBusy(true); onBusyChange?.(true); setFailed([]);
    const results: (UploadImage | undefined)[] = new Array(sources.length);
    const failures: { source: File | string; message: string }[] = [];
    let completed = 0;
    setProgress("Uploading 0 of " + sources.length + " photos...");
    try {
      await runUploadBatch(sources, source => uploadPhoto(source, review), (index, result) => {
        completed++;
        if (result.status === "fulfilled") results[index] = result.value;
        else failures.push({ source: sources[index], message: result.reason instanceof Error ? result.reason.message : "Upload failed. Please retry." });
        onChange([...value, ...results.filter((v): v is UploadImage => !!v)].map((v, i) => ({ ...v, sortOrder: i })));
        setProgress("Processed " + completed + " of " + sources.length + " photos...");
      });
      setFailed(failures);
      if (urls) setImageUrls(failures.map(f => String(f.source)).join("\n"));
      setProgress((sources.length - failures.length) + " photo(s) added" + (failures.length ? "; " + failures.length + " failed. Successful photos are kept." : ". Ready to save."));
    } finally { running.current = false; setBusy(false); onBusyChange?.(false); }
  }
  return <div className="wide photo-upload" aria-busy={busy}>
    <label className="field">{review ? "Add a photo (optional)" : "Choose vehicle photos"}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple={!review} disabled={busy}
        onChange={async e => { const input = e.currentTarget; const files = Array.from(input.files || []); await upload(files); input.value = ""; }} />
    </label>
    <p className="muted">{review ? "One photo" : "Up to 30 photos"}, 15 MB each. JPG, PNG, WebP or HEIC.</p>
    {!review && <div className="url-upload">
      <label className="field">Add photos from URLs
        <textarea value={imageUrls} disabled={busy} rows={5} placeholder={"https://example.com/front.jpg\nhttps://example.com/interior.jpg"} onChange={e => setImageUrls(e.target.value)} />
      </label>
      <p className="muted">Paste one direct image link per line. Up to three photos upload at once. Duplicate links in this batch are ignored.</p>
      <button type="button" disabled={busy || !imageUrls.trim()} onClick={() => upload(parseImageUrls(imageUrls), true)}>Add photos from URLs</button>
    </div>}
    {progress && <p role="status">{progress}{busy ? " Keep this page open." : ""}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {!!failed.length && <div className="error" role="alert">
      <p>Some photos could not be uploaded:</p>
      <ul>{failed.map((item, index) => <li key={index}>{typeof item.source === "string" ? item.source : item.source.name}: {item.message}</li>)}</ul>
      <button type="button" disabled={busy} onClick={() => upload(failed.map(f => f.source), failed.every(f => typeof f.source === "string"))}>Retry failed photos</button>
    </div>}
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
