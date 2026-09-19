import { v2 as cloudinary } from "cloudinary";
import { Vehicle, Review } from "./models";
export async function removeUnusedVehicleImages(publicIds: string[]) {
  if (!process.env.CLOUDINARY_API_SECRET) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  for (const publicId of publicIds) {
    if (!publicId.startsWith("bassautoworld/vehicles/")) continue;
    const [vehicle, review] = await Promise.all([
      Vehicle.exists({ "images.publicId": publicId }),
      Review.exists({ "image.publicId": publicId }),
    ]);
    if (vehicle || review) continue;
    try {
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image",
      });
    } catch {
      console.error(
        JSON.stringify({
          level: "error",
          route: "vehicle-media-cleanup",
          message: "Cloudinary deletion failed; asset retained",
        }),
      );
    }
  }
}
