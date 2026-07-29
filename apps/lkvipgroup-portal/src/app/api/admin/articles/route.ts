import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

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
      const article = await prisma.blog.findUnique({ where: { slug } });
      if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        tags: article.tags,
        featuredImage: article.featuredImage,
        status: article.status,
        updatedAt: article.updatedAt,
        seo: { title: article.seoTitle, description: article.seoDesc },
        readTime: `${Math.max(1, Math.ceil(article.content.length / 2000))} min read`,
      });
    }

    const articles = await prisma.blog.findMany({
      select: { slug: true, title: true, excerpt: true, category: true, tags: true, featuredImage: true, status: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(articles);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.slug || !body.title) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    await prisma.blog.upsert({
      where: { slug: body.slug },
      create: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt ?? "",
        content: body.content ?? "",
        category: body.category ?? "Market Insights",
        tags: body.tags ?? [],
        featuredImage: body.featuredImage ?? "",
        status: body.status ?? "draft",
        seoTitle: body.seo?.title ?? body.title,
        seoDesc: body.seo?.description ?? body.excerpt ?? "",
      },
      update: {
        title: body.title,
        excerpt: body.excerpt ?? "",
        content: body.content ?? "",
        category: body.category ?? "Market Insights",
        tags: body.tags ?? [],
        featuredImage: body.featuredImage ?? "",
        status: body.status ?? "draft",
        seoTitle: body.seo?.title ?? body.title,
        seoDesc: body.seo?.description ?? body.excerpt ?? "",
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
