export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  companyName: string;
  logo: string;
  favicon: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  googleMap: string;
  socialLinks: SocialLink[];
  googleAnalyticsId: string;
  metaPixelId: string;
  footer: string;
}

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
}

export interface PageSection {
  id: string;
  type: string;
  title: string;
  content: string;
  image?: string;
  order: number;
}

export interface PageData {
  slug: string;
  title: string;
  hero: Record<string, unknown>;
  sections: PageSection[];
  seo: PageSEO;
  updatedAt: Date;
}

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: Date | null;
  seo: PageSEO;
  createdAt: Date;
  updatedAt: Date;
}

export type EnquiryType =
  | "Contact"
  | "Investment Opportunity"
  | "Business Acquisition"
  | "Joint Venture"
  | "Strategic Partnership";

export interface Enquiry {
  type: EnquiryType;
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  document: string;
  status: "new" | "read" | "archived";
  createdAt: Date;
}

export interface UploadRecord {
  publicId: string;
  secureUrl: string;
  folder: string;
  resourceType: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
}

export interface DashboardStats {
  blogCount: number;
  draftCount: number;
  publishedCount: number;
  enquiryCount: number;
  recentEnquiries: Enquiry[];
  recentPosts: BlogPost[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface AdminUser {
  name: string;
  email: string;
  role: "admin" | "superadmin";
  lastLogin: Date | null;
}
