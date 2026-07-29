import { prisma } from "@/lib/db";

export async function createEnquiry(data: {
  type: string; name: string; email: string; phone?: string;
  company?: string; subject?: string; message: string; document?: string;
}) {
  return prisma.enquiry.create({
    data: {
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      company: data.company ?? "",
      subject: data.subject ?? "",
      message: data.message,
      document: data.document ?? "",
    },
  });
}

export async function getEnquiries(options?: {
  status?: string; type?: string; page?: number; limit?: number;
}) {
  const { status, type, page = 1, limit = 20 } = options ?? {};
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [total, enquiries] = await prisma.$transaction([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { enquiries, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getEnquiryById(id: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) throw new Error("Enquiry not found");
  return enquiry;
}

export async function updateEnquiryStatus(id: string, status: "new" | "read" | "archived") {
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) throw new Error("Enquiry not found");
  return prisma.enquiry.update({ where: { id }, data: { status } });
}

export async function deleteEnquiry(id: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) throw new Error("Enquiry not found");
  return prisma.enquiry.delete({ where: { id } });
}
