import { NextRequest } from "next/server";
import { blogService } from "@/services";
import { blogSchema, formatZodErrors } from "@/validators";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  notFoundResponse,
} from "@/utils/api-response";
import { handleError, NotFoundError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const category = request.nextUrl.searchParams.get("category") || undefined;
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");

    if (slug) {
      const post = await blogService.getBlogBySlug(slug);
      return successResponse(post);
    }

    const categories = request.nextUrl.searchParams.get("categories");
    if (categories !== null) {
      const cats = await blogService.getBlogCategories();
      return successResponse(cats);
    }

    const result = await blogService.getBlogs({ status, category, search, page, limit });
    return successResponse(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = blogSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error));
    }

    const post = await blogService.createBlog(parsed.data);
    return successResponse(post, "Blog post created successfully", 201);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) return errorResponse("Slug is required");

    const body = await request.json();
    const parsed = blogSchema.partial().safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error));
    }

    const post = await blogService.updateBlog(slug, parsed.data);
    return successResponse(post, "Blog post updated successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) return errorResponse("Slug is required");

    await blogService.deleteBlog(slug);
    return successResponse(null, "Blog post deleted successfully");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}
