// ── Portal types (lkvipgroup.com) ─────────────────────────────────────────────

export interface PortalNewsArticle {
  id:           string;
  title:        string;
  slug:         string;
  excerpt:      string;
  content:      string;
  category:     'announcement' | 'event' | 'update' | 'blog';
  tags:         string[];
  author:       { id: string; fullName: string; avatar?: string };
  publishedAt:  Date;
  featuredImage: string;
  status:       'draft' | 'published' | 'archived';
  views:        number;
}

export interface PortalEcosystemItem {
  id?:          string;
  name:         string;
  icon?:        string;
  color:        string;
  desc:         string;
  description?: string;
  url:          string;
  status:       'live' | 'beta' | 'coming-soon';
  category:     'platform' | 'service' | 'product' | 'community';
  metrics?: {
    users:        number;
    transactions: number;
    volume:       string;
  };
}

export interface PortalCareerPosition {
  id:           string;
  title:        string;
  department:   string;
  location:     'remote' | 'hanoi' | 'hcmc' | 'danang';
  type:         'fulltime' | 'parttime' | 'contract' | 'internship';
  description?: string;
  requirements: string[];
  salary:       { min: number; max: number; currency: string };
  postedAt:     Date;
  deadline:     Date;
}

export interface PortalContactMessage {
  id?:       string;
  name:      string;
  email:     string;
  phone?:    string;
  subject:   string;
  message:   string;
  status?:   'pending' | 'replied' | 'resolved';
  createdAt?: Date;
}
