import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { Prisma } from "../../../../../node_modules/.prisma/fortress-client";

function toJson<T>(v: T): Prisma.InputJsonValue {
  return v as unknown as Prisma.InputJsonValue;
}

const DEFAULT_PAGES = [
  "home", "about", "investment-focus", "our-approach",
  "partner-with-us", "contact", "privacy-policy",
  "terms-of-use", "investment-disclaimer",
];

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
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
      return NextResponse.json(page);
    }

    const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
    const result = DEFAULT_PAGES.map((s) => {
      const existing = pages.find((p) => p.slug === s);
      return existing ?? { slug: s, title: s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { slug, title, content } = await request.json();
    if (!slug || title === undefined || content === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await prisma.page.upsert({
      where: { slug },
      create: { slug, title, content, hero: toJson({}), sections: toJson([]) },
      update: { title, content },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
