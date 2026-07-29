import { prisma } from "@/lib/db";
import type { Prisma } from "../../node_modules/.prisma/fortress-client";

const DEFAULT_PAGES = [
  "home", "about", "investment-focus", "our-approach",
  "partner-with-us", "contact", "privacy-policy",
  "terms-of-use", "investment-disclaimer",
];

function toJson<T>(v: T): Prisma.InputJsonValue {
  return v as unknown as Prisma.InputJsonValue;
}

export async function getPage(slug: string) {
  let page = await prisma.page.findUnique({ where: { slug } });
  if (!page) {
    page = await prisma.page.create({
      data: {
        slug,
        title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        content: "",
        hero: toJson({}),
        sections: toJson([]),
      },
    });
  }
  return page;
}

export async function getAllPages() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return DEFAULT_PAGES.map((slug) => {
    const existing = pages.find((p) => p.slug === slug);
    return existing ?? { slug, title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
  });
}

export async function updatePage(slug: string, data: {
  title?: string;
  content?: string;
  hero?: Record<string, unknown>;
  sections?: unknown[];
  seo?: { title?: string; description?: string; keywords?: string; ogImage?: string; canonicalUrl?: string };
}) {
  return prisma.page.upsert({
    where: { slug },
    create: {
      slug,
      title: data.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      content: data.content ?? "",
      hero: toJson(data.hero ?? {}),
      sections: toJson(data.sections ?? []),
      seoTitle: data.seo?.title ?? "",
      seoDesc: data.seo?.description ?? "",
      seoKeywords: data.seo?.keywords ?? "",
      seoOgImage: data.seo?.ogImage ?? "",
      seoCanonical: data.seo?.canonicalUrl ?? "",
    },
    update: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.hero !== undefined && { hero: toJson(data.hero) }),
      ...(data.sections !== undefined && { sections: toJson(data.sections) }),
      ...(data.seo !== undefined && {
        seoTitle: data.seo.title ?? "",
        seoDesc: data.seo.description ?? "",
        seoKeywords: data.seo.keywords ?? "",
        seoOgImage: data.seo.ogImage ?? "",
        seoCanonical: data.seo.canonicalUrl ?? "",
      }),
    },
  });
}
