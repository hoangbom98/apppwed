import { NextRequest } from "next/server";
import { enquiryService } from "@/services";
import { contactEnquirySchema, formatZodErrors } from "@/validators";
import { rateLimit } from "@/utils/rate-limit";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/utils/api-response";
import { handleError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const type = request.nextUrl.searchParams.get("type") || undefined;
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    const result = await enquiryService.getEnquiries({ status, type, page, limit });
    return successResponse(result);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateCheck = rateLimit(`enquiry:${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const parsed = contactEnquirySchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error));
    }

    const enquiry = await enquiryService.createEnquiry(parsed.data);
    return successResponse(enquiry, "Enquiry submitted successfully", 201);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}
