import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Extracts the Cloudinary public_id (including folder) from a full Cloudinary URL.
 * Example URL: https://res.cloudinary.com/demo/image/upload/v123456/leadmagnets/my-file.jpg
 * Returns: "leadmagnets/my-file"
 */
export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  // Verify it is a Cloudinary URL
  if (!url.includes("cloudinary.com")) return null;

  try {
    // Look for leadmagnets folder or upload/ pattern
    const folderIndex = url.indexOf("/leadmagnets/");
    if (folderIndex !== -1) {
      // Get string starting from "leadmagnets/"
      const pathWithExt = url.substring(folderIndex + 1); // "leadmagnets/abc-file.png"
      // Remove query parameters if any
      const cleanPath = pathWithExt.split("?")[0];
      // Strip file extension (.jpg, .png, .jpeg, .webp, .pdf, etc.)
      const publicId = cleanPath.replace(/\.[^/.]+$/, "");
      return publicId;
    }

    // Fallback for upload/ pattern without explicit folder
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex !== -1) {
      let afterUpload = url.substring(uploadIndex + 8); // Skip "/upload/"
      afterUpload = afterUpload.split("?")[0];
      // Remove transformation flags (e.g. f_auto,q_auto/ or v123456/)
      const parts = afterUpload.split("/");
      const validParts = parts.filter(
        (part) => !part.includes(",") && !/^v\d+$/.test(part)
      );
      const fullPath = validParts.join("/");
      return fullPath.replace(/\.[^/.]+$/, "");
    }
  } catch (err) {
    console.warn("Failed to parse Cloudinary public_id from URL:", url, err);
  }

  return null;
}

/**
 * Permanently deletes a single asset from Cloudinary using its URL.
 */
export async function deleteCloudinaryAsset(url: string | null | undefined): Promise<boolean> {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary credentials not set, skipping remote deletion for:", publicId);
    return false;
  }

  try {
    // Try image resource type first with CDN invalidation
    const resImage = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    if (resImage?.result === "ok") {
      console.log(`Successfully deleted Cloudinary image asset: ${publicId}`);
      return true;
    }

    // If image destroy returned not_found, try raw resource type (PDFs/files)
    if (resImage?.result === "not_found") {
      const resRaw = await cloudinary.uploader.destroy(publicId, { resource_type: "raw", invalidate: true });
      if (resRaw?.result === "ok") {
        console.log(`Successfully deleted Cloudinary raw asset: ${publicId}`);
        return true;
      }
    }
  } catch (err) {
    console.error(`Error deleting Cloudinary asset (${publicId}):`, err);
  }

  return false;
}

/**
 * Permanently deletes multiple assets from Cloudinary in parallel.
 */
export async function deleteCloudinaryAssets(urls: (string | null | undefined)[]): Promise<void> {
  const validUrls = Array.from(new Set(urls.filter((u): u is string => Boolean(u && typeof u === "string"))));
  if (validUrls.length === 0) return;

  await Promise.allSettled(validUrls.map((url) => deleteCloudinaryAsset(url)));
}
