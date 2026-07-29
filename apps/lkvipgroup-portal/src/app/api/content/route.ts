import { NextRequest } from "next/server";
import { contentService } from "@/services";
import { pageContentSchema, formatZodErrors } from "@/validators";
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
  notFoundResponse,
} from "@/utils/api-response";
import { handleError, NotFoundError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    if (slug) {
      const page = await contentService.getPage(slug);
      return successResponse(page);
    }

    const pages = await contentService.getAllPages();
    return successResponse(pages);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = pageContentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error));
    }

    const page = await contentService.updatePage(parsed.data.slug, parsed.data);
    return successResponse(page, "Page updated successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}
