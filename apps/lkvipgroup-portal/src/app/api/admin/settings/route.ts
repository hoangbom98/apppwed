import { NextResponse } from "next/server";
import { settingsService } from "@/services";
import { getCurrentUser } from "@/lib/auth-utils";

const DEFAULT_SETTINGS = {
  companyName: "Fortress Investment Holdings",
  logo: "/large-logo.png",
  favicon: "",
  email: "info@fortressih.com",
  phone: "+971 4 XXX XXXX",
  address: "Dubai, United Arab Emirates",
  whatsapp: "971500000000",
  googleMap: "",
  socialLinks: [] as { platform: string; url: string }[],
  googleAnalyticsId: "",
  metaPixelId: "",
  footer: "",
};

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const settings = await settingsService.getSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function PUT(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;
  try {
    const data = await request.json();
    await settingsService.updateSettings(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
