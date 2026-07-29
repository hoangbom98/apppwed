import { prisma } from "@/lib/db";

export async function getDashboardStats() {
  const [blogCount, draftCount, publishedCount, enquiryCount, recentEnquiries, recentPosts] =
    await prisma.$transaction([
      prisma.blog.count(),
      prisma.blog.count({ where: { status: "draft" } }),
      prisma.blog.count({ where: { status: "published" } }),
      prisma.enquiry.count(),
      prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.blog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  return { blogCount, draftCount, publishedCount, enquiryCount, recentEnquiries, recentPosts };
}
