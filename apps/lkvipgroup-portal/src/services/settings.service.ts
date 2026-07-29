import { prisma } from "@/lib/db";

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

export async function getSettings() {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: { socialLinks: DEFAULT_SETTINGS.socialLinks } });
    }
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS, id: "", createdAt: new Date(), updatedAt: new Date() };
  }
}

export async function updateSettings(data: Partial<typeof DEFAULT_SETTINGS>) {
  const existing = await prisma.settings.findFirst();
  if (existing) {
    return prisma.settings.update({ where: { id: existing.id }, data });
  }
  return prisma.settings.create({ data: { ...DEFAULT_SETTINGS, ...data } });
}
