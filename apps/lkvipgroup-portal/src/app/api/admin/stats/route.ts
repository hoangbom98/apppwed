import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  try {
    const blogPosts = await prisma.blog.count();
    const totalContacts = await prisma.enquiry.count({ where: { type: "Contact" } });
    const totalSubmissions = await prisma.enquiry.count({
      where: { type: { in: ["Investment Opportunity", "Business Acquisition", "Joint Venture", "Strategic Partnership"] } },
    });
    const recentEnquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 });

    const activities = recentEnquiries.map((e) => ({
      id: e.id,
      type: (e.type === "Contact" ? "contact" : "submission") as "contact" | "submission",
      title: e.name,
      description: e.subject || e.type,
      time: e.createdAt,
    }));

    return NextResponse.json({ blogPosts, totalContacts, totalSubmissions, activities });
  } catch {
    return NextResponse.json({ blogPosts: 0, totalContacts: 0, totalSubmissions: 0, activities: [] });
  }
}
