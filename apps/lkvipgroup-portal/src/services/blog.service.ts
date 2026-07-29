import { prisma } from "@/lib/db";

function toSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = toSlug(base);
  let counter = 1;
  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${toSlug(base)}-${counter++}`;
  }
  return slug;
}

export interface BlogInput {
  title: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  status?: "draft" | "published";
  featured?: boolean;
  readTime?: number;
  publishedAt?: string | null;
  seo?: { title?: string; description?: string; keywords?: string; ogImage?: string; canonicalUrl?: string };
}

export async function getBlogs(options?: {
  status?: string; category?: string; search?: string; page?: number; limit?: number;
}) {
  const { status, category, search, page = 1, limit = 10 } = options ?? {};
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) where.OR = [
    { title: { contains: search, mode: "insensitive" } },
    { excerpt: { contains: search, mode: "insensitive" } },
  ];

  const [total, posts] = await prisma.$transaction([
    prisma.blog.count({ where }),
    prisma.blog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { posts, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getBlogBySlug(slug: string) {
  const post = await prisma.blog.findUnique({ where: { slug } });
  if (!post) throw new Error("Blog post not found");
  return post;
}

export async function createBlog(data: BlogInput) {
  const slug = await uniqueSlug(data.title);
  return prisma.blog.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? "",
      content: data.content ?? "",
      featuredImage: data.featuredImage ?? "",
      category: data.category ?? "General",
      tags: data.tags ?? [],
      status: data.status ?? "draft",
      featured: data.featured ?? false,
      readTime: data.readTime ?? 5,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      seoTitle: data.seo?.title ?? "",
      seoDesc: data.seo?.description ?? "",
      seoKeywords: data.seo?.keywords ?? "",
      seoOgImage: data.seo?.ogImage ?? "",
      seoCanonical: data.seo?.canonicalUrl ?? "",
    },
  });
}

export async function updateBlog(slug: string, data: Partial<BlogInput>) {
  const post = await prisma.blog.findUnique({ where: { slug } });
  if (!post) throw new Error("Blog post not found");
  return prisma.blog.update({
    where: { slug },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.readTime !== undefined && { readTime: data.readTime }),
      ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt ? new Date(data.publishedAt) : null }),
      ...(data.seo !== undefined && {
        seoTitle: data.seo.title ?? post.seoTitle,
        seoDesc: data.seo.description ?? post.seoDesc,
        seoKeywords: data.seo.keywords ?? post.seoKeywords,
        seoOgImage: data.seo.ogImage ?? post.seoOgImage,
        seoCanonical: data.seo.canonicalUrl ?? post.seoCanonical,
      }),
    },
  });
}

export async function deleteBlog(slug: string) {
  const post = await prisma.blog.findUnique({ where: { slug } });
  if (!post) throw new Error("Blog post not found");
  return prisma.blog.delete({ where: { slug } });
}

export async function publishBlog(slug: string) {
  return prisma.blog.update({ where: { slug }, data: { status: "published", publishedAt: new Date() } });
}

export async function unpublishBlog(slug: string) {
  return prisma.blog.update({ where: { slug }, data: { status: "draft", publishedAt: null } });
}

export async function getBlogCategories() {
  const rows = await prisma.blog.findMany({ select: { category: true }, distinct: ["category"] });
  return rows.map((r) => r.category);
}
