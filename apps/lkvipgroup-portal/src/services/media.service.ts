import { prisma } from "@/lib/db";
import { uploadToCloudinary, deleteFromCloudinary, validateFile } from "@/utils/cloudinary";

export async function uploadFile(file: File, folder = "fortress") {
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error ?? "Invalid file");

  const result = await uploadToCloudinary(file, folder);

  try {
    await prisma.upload.create({
      data: {
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        folder,
        resourceType: result.resourceType,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch {
    console.error("Failed to save upload record to DB, but Cloudinary upload succeeded");
  }

  return result;
}

export async function deleteFile(publicId: string) {
  await deleteFromCloudinary(publicId);
  return prisma.upload.deleteMany({ where: { publicId } });
}

export async function listUploads(folder?: string) {
  return prisma.upload.findMany({
    where: folder ? { folder } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
