import { NextRequest } from "next/server";
import { mediaService } from "@/services";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/utils/api-response";
import { handleError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const folder = request.nextUrl.searchParams.get("folder") || undefined;
    const uploads = await mediaService.listUploads(folder);
    return successResponse(uploads);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "fortress";

    if (!file) {
      return errorResponse("No file provided");
    }

    const result = await mediaService.uploadFile(file, folder);
    return successResponse(result, "File uploaded successfully", 201);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const publicId = request.nextUrl.searchParams.get("publicId");
    if (!publicId) {
      return errorResponse("publicId is required");
    }

    await mediaService.deleteFile(publicId);
    return successResponse(null, "File deleted successfully");
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}
