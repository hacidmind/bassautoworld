import { imageSchema } from "./validation";

export function parseImageUrls(text: string) {
  return [
    ...new Set(
      text
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

export async function uploadPhoto(source: File | string, review: boolean) {
  if (typeof source === "string") {
    let url: URL;
    try {
      url = new URL(source);
    } catch {
      throw new Error("Enter a complete image URL starting with https://.");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error(
        "Use a public HTTP or HTTPS image link without login credentials.",
      );
  } else {
    if (
      !/^image\/(jpeg|png|webp|heic|heif)$/.test(source.type) &&
      !/\.(jpe?g|png|webp|heic|heif)$/i.test(source.name)
    )
      throw new Error("Choose a JPG, PNG, WebP or HEIC photo.");
    if (source.size > 15 * 1024 * 1024)
      throw new Error("Photo exceeds 15 MB. Choose a smaller image.");
  }
  try {
    const sign = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review }),
      signal: AbortSignal.timeout(30000),
    });
    const signature = await sign.json().catch(() => null);
    if (!sign.ok || !signature?.params)
      throw new Error(
        signature?.error ||
          "Could not prepare the upload. Refresh the page and sign in again.",
      );
    const form = new FormData();
    form.set("file", source);
    for (const [key, value] of Object.entries(signature.params))
      form.set(key, String(value));
    form.set("api_key", signature.apiKey);
    form.set("signature", signature.signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(120000),
      },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        throw new Error(
          "Cloudinary rejected the upload credentials. Check the Cloudinary settings in this site's hosting environment, then redeploy.",
        );
      throw new Error(
        data?.error?.message ||
          `Photo upload failed (${response.status}). Check that the image is publicly accessible and try again.`,
      );
    }
    const parsed = imageSchema.safeParse({
      publicId: data?.public_id,
      secureUrl: data?.secure_url,
      width: data?.width,
      height: data?.height,
      format: data?.format,
      alt:
        typeof source === "string"
          ? "Vehicle photo"
          : source.name.replace(/\.[^.]+$/, "").slice(0, 250),
      sortOrder: 0,
    });
    if (!parsed.success)
      throw new Error(
        "The upload returned incomplete image details. Please try again.",
      );
    return parsed.data;
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new Error(
        "Upload timed out. Check your connection and retry this photo.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Could not reach the upload service. Check your connection or browser blocking settings and retry.",
      );
    throw error;
  }
}

// Limit simultaneous transfers and report each result; a failed item never cancels siblings.
export async function runUploadBatch<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  onResult: (index: number, result: PromiseSettledResult<R>) => void,
) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(3, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        let result: PromiseSettledResult<R>;
        try {
          result = { status: "fulfilled", value: await worker(items[index]) };
        } catch (reason) {
          result = { status: "rejected", reason };
        }
        onResult(index, result);
      }
    }),
  );
}
