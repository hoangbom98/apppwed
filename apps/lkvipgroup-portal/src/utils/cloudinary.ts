import { v2 as cloudinary } from "cloudinary";

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export type AllowedResourceType = "image" | "raw" | "video";
export type AllowedImageFormat = "jpg" | "jpeg" | "png" | "webp" | "avif";
export type AllowedDocFormat = "pdf" | "doc" | "docx";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_DOC_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 20 * 1024 * 1024;

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: "Image must be under 5MB" };
    }
    return { valid: true };
  }

  if (ALLOWED_DOC_TYPES.includes(file.type)) {
    if (file.size > MAX_DOC_SIZE) {
      return { valid: false, error: "Document must be under 20MB" };
    }
    return { valid: true };
  }

  return { valid: false, error: "Unsupported file type. Allowed: JPEG, PNG, WebP, AVIF, PDF, DOC, DOCX" };
}

interface UploadResult {
  publicId: string;
  secureUrl: string;
  resourceType: string;
}

export async function uploadToCloudinary(
  file: File,
  folder = "fortress"
): Promise<UploadResult> {
  const cld = getCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const resourceType: AllowedResourceType = file.type.startsWith("image/") ? "image" : "raw";

  const result = await cld.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    resourceType: result.resource_type,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cld = getCloudinary();
  await cld.uploader.destroy(publicId);
}

export async function replaceInCloudinary(
  file: File,
  oldPublicId: string,
  folder = "fortress"
): Promise<UploadResult> {
  await deleteFromCloudinary(oldPublicId);
  return uploadToCloudinary(file, folder);
}
