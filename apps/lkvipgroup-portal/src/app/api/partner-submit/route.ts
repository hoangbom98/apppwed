import { NextResponse } from "next/server";
import { enquiryService } from "@/services";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await enquiryService.createEnquiry({
      type: "Investment Opportunity",
      name: `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim(),
      email: body.email ?? "",
      phone: body.phone ?? "",
      company: body.company ?? "",
      subject: body.enquiryType ?? "",
      message: body.objectives ?? body.message ?? "",
      document: body.fileName ?? "",
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to submit" },
      { status: 400 }
    );
  }
}
