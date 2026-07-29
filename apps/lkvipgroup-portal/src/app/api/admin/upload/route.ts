import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { uploadFile } from "@/services/media.service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, "fortress/blog");

    return NextResponse.json({ url: result.secureUrl, publicId: result.publicId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
