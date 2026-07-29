import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

/**
 * GET /api/admin/analytics
 * Returns 30-day trend data for enquiries and blog activity
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Run all queries in parallel
    const [
      totalEnquiries,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      newEnquiries,
      contactCount,
      submissionCount,
      recentEnquiries,
      blogsByCategory,
      enquiriesByType,
    ] = await Promise.all([
      prisma.enquiry.count(),
      prisma.blog.count(),
      prisma.blog.count({ where: { status: "published" } }),
      prisma.blog.count({ where: { status: "draft" } }),
      prisma.enquiry.count({ where: { status: "new" } }),
      prisma.enquiry.count({ where: { type: "Contact" } }),
      prisma.enquiry.count({
        where: { type: { in: ["Investment Opportunity", "Business Acquisition", "Joint Venture", "Strategic Partnership"] } },
      }),
      // Last 30 days daily enquiry counts — raw grouped
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
        FROM fortress_enquiries
        WHERE "createdAt" >= ${since}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `,
      // Blog articles grouped by category
      prisma.blog.groupBy({
        by: ["category"],
        _count: true,
        orderBy: { _count: { category: "desc" } },
        take: 10,
      }),
      // Enquiries grouped by type
      prisma.enquiry.groupBy({
        by: ["type"],
        _count: true,
        orderBy: { _count: { type: "desc" } },
      }),
    ]);

    // Normalise BigInt → number for JSON
    const trend = (recentEnquiries as { day: Date; count: bigint }[]).map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      count: Number(r.count),
    }));

    return NextResponse.json({
      summary: {
        totalEnquiries,
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        newEnquiries,
        contactCount,
        submissionCount,
      },
      trend,
      blogsByCategory: blogsByCategory.map((b) => ({
        category: b.category,
        count: typeof b._count === "object" ? (b._count as Record<string, number>)._all ?? 0 : 0,
      })),
      enquiriesByType: enquiriesByType.map((e) => ({
        type: e.type,
        count: typeof e._count === "object" ? (e._count as Record<string, number>)._all ?? 0 : 0,
      })),
    });
  } catch {
    return NextResponse.json({
      summary: {
        totalEnquiries: 0,
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        newEnquiries: 0,
        contactCount: 0,
        submissionCount: 0,
      },
      trend: [],
      blogsByCategory: [],
      enquiriesByType: [],
    });
  }
}
