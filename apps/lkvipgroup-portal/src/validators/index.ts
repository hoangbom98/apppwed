// Validators đã được đơn giản hóa — validation dùng Zod trực tiếp trong routes
// Các type được export từ services/
export { type BlogInput } from "@/services/blog.service";

import { z } from "zod";

// blogSchema — aligned với BlogInput trong blog.service.ts
export const blogSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300).optional(),
  excerpt: z.string().optional().default(""),
  content: z.string().optional().default(""),
  category: z.string().optional().default("General"),
  tags: z.array(z.string()).optional().default([]),
  featuredImage: z.string().optional().default(""),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  featured: z.boolean().optional().default(false),
  seoTitle: z.string().optional().default(""),
  seoDesc: z.string().optional().default(""),
  seoKeywords: z.string().optional().default(""),
  seoOgImage: z.string().optional().default(""),
  readTime: z.number().optional().default(5),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const contactEnquirySchema = z.object({
  type: z.enum(["Contact", "Investment Opportunity", "Business Acquisition", "Joint Venture", "Strategic Partnership"]),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  message: z.string().min(1).max(5000),
  document: z.string().optional().default(""),
});

export const settingsSchema = z.object({
  companyName: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  googleMap: z.string().optional(),
  socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })).optional(),
  googleAnalyticsId: z.string().optional(),
  metaPixelId: z.string().optional(),
  footer: z.string().optional(),
});

export const pageContentSchema = z.object({
  slug: z.string().min(1),
  title: z.string().optional(),
  content: z.string().optional(),
  hero: z.record(z.string(), z.unknown()).optional(),
  sections: z.array(z.unknown()).optional(),
  seo: z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
    keywords: z.string().optional().default(""),
    ogImage: z.string().optional().default(""),
    canonicalUrl: z.string().optional().default(""),
  }).optional(),
});

export const seoSchema = z.object({
  pageSlug: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
});

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!formatted[path]) formatted[path] = [];
    formatted[path].push(issue.message);
  }
  return formatted;
}

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type PageContentInput = z.infer<typeof pageContentSchema>;
export type SEOInput = z.infer<typeof seoSchema>;
