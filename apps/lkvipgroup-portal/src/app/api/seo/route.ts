import { NextRequest } from "next/server";
import { contentService } from "@/services";
import { seoSchema, formatZodErrors } from "@/validators";
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
    if (!slug) {
      return successResponse({ message: "Provide a slug parameter" });
    }

    const page = await contentService.getPage(slug);
    return successResponse({
      slug: page.slug,
      seo: {
        title: page.seoTitle ?? "",
        description: page.seoDesc ?? "",
        keywords: page.seoKeywords ?? "",
        ogImage: page.seoOgImage ?? "",
        canonicalUrl: page.seoCanonical ?? "",
      },
    });
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
    const parsed = seoSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error));
    }

    const { pageSlug, ...seoData } = parsed.data;
    const page = await contentService.updatePage(pageSlug, {
      seo: {
        title: seoData.title ?? "",
        description: seoData.description ?? "",
        keywords: seoData.keywords ?? "",
        ogImage: seoData.ogImage ?? "",
        canonicalUrl: seoData.canonicalUrl ?? "",
      },
    });
    return successResponse(
      {
        slug: page.slug,
        seo: {
          title: page.seoTitle,
          description: page.seoDesc,
          keywords: page.seoKeywords,
          ogImage: page.seoOgImage,
          canonicalUrl: page.seoCanonical,
        },
      },
      "SEO updated successfully"
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}
