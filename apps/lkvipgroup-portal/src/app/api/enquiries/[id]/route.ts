import { NextRequest } from "next/server";
import { enquiryService } from "@/services";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  notFoundResponse,
} from "@/utils/api-response";
import { handleError, NotFoundError } from "@/utils/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiry = await enquiryService.getEnquiryById(id);
    return successResponse(enquiry);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["new", "read", "archived"].includes(status)) {
      return errorResponse("Invalid status. Must be: new, read, or archived");
    }

    const enquiry = await enquiryService.updateEnquiryStatus(id, status);
    return successResponse(enquiry, "Enquiry updated successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await enquiryService.deleteEnquiry(id);
    return successResponse(null, "Enquiry deleted successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}
