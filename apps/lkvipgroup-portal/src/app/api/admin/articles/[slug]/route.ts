import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { slug } = await params;
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
      readTime: `${Math.max(1, Math.ceil(article.content.length / 2000))} min read`,
      seo: { title: article.seoTitle, description: article.seoDesc },
      date: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
        : new Date(article.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }),
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { slug } = await params;
    const body = await request.json();
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.blog.update({
      where: { slug },
      data: {
        title: body.title ?? existing.title,
        excerpt: body.excerpt ?? existing.excerpt,
        content: body.content ?? existing.content,
        category: body.category ?? existing.category,
        tags: body.tags ?? existing.tags,
        featuredImage: body.featuredImage ?? existing.featuredImage,
        status: body.status ?? existing.status,
        seoTitle: body.seo?.title ?? existing.seoTitle,
        seoDesc: body.seo?.description ?? existing.seoDesc,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const { slug } = await params;
    await prisma.blog.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
