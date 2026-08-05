// ═══════════════════════════════════════════════════════════════════════════
//  @lkvip/shared — Types tập trung
//  Dùng chung cho: apps/landing, apps/admin-dashboard, và các SPA khác
// ═══════════════════════════════════════════════════════════════════════════

// ── User & Auth ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'user' | string;
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  user?: User;
}

// ── Property (Omnis Real Estate) ──────────────────────────────────────────────

export interface Property {
  id: string;
  _id?: string;
  slug?: string;
  title: string;
  description?: string;
  price: number;
  area: number | string;
  bedrooms: number | string;
  bathrooms: number | string;
  /** UI/legacy alias for category */
  type?: string;
  /** Backend canonical type: apartment, villa, penthouse, townhouse… */
  propertyType?: string;
  category: 'off-plan' | 'secondary' | 'rental';
  /** Buy | Rent | Off-Plan — listing type từ backend */
  listedIn?: string;
  location: string;
  address?: string;
  region?: string;
  areaLocation?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  developer?: string;
  /** Backend alias */
  developerName?: string;
  status: 'off-plan' | 'ready' | 'pending' | string;
  image: string;
  images?: string[];
  amenities?: string[];
  yearBuilt?: number;
  yearlyTaxRate?: number;
  kitchens?: number;
  garages?: number;
  garageSize?: number;
  floorsNo?: number;
  videoUrl?: string;
  technicalPdf?: string;
  floorPlans?: string[];
  featured?: boolean;
  theme?: 'default' | 'modern' | 'minimal';
  // Off-plan fields
  unitTypes?: string;
  handoverYear?: string;
  totalFloors?: number;
  paymentPlan?: {
    onBooking?: number;
    duringConstruction?: number;
    onHandover?: number;
  };
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export interface Blog {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  summary?: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  previewImage?: string;
  author?: string;
  category?: string;
  tags?: string[];
  views?: number;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Inquiry / Contact ─────────────────────────────────────────────────────────

export interface Inquiry {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  status: 'new' | 'in-progress' | 'resolved';
  createdAt: string;
}

// ── KYC ──────────────────────────────────────────────────────────────────────

export interface KycRecord {
  _id: string;
  id?: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  nationality?: string;
  address?: string;
  idType?: 'passport' | 'emirates_id' | string;
  idNumber?: string;
  passportCopy?: string;
  emiratesIdCopy?: string;
  supportingDocuments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Social Channel ────────────────────────────────────────────────────────────

export interface SocialChannel {
  _id: string;
  name: string;
  platform: 'whatsapp' | 'telegram' | 'youtube' | 'facebook' | 'instagram' | 'x' | 'linkedin' | 'link' | string;
  url: string;
  isActive: boolean;
  order?: number;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProperties: number;
  totalInquiries: number;
  activeListings: number;
  newInquiries: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// ── API response envelope ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
