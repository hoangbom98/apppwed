// ── Store types (store.lkvipgroup.com) ────────────────────────────────────────

export type ProductType =
  | 'service'
  | 'digital_asset'
  | 'subscription'
  | 'template'
  | 'api'
  | 'course';

export type ProductCategory =
  | 'software_development'
  | 'consulting'
  | 'security'
  | 'ai_solutions'
  | 'training'
  | 'source_code'
  | 'templates'
  | 'api_plugins'
  | 'data_content';

export interface StoreProduct {
  id:               string;
  name:             string;
  slug:             string;
  description:      string;
  shortDescription: string;
  category:         ProductCategory;
  type:             ProductType;
  price: {
    amount:   number;
    currency: string;
    discount?: number;
    subscription?: { interval: 'monthly' | 'yearly'; price: number };
  };
  images:       string[];
  files:        Array<{ url: string; size: number; type: string }>;
  requirements: string[];
  features:     string[];
  documentation?: string;
  demoUrl?:     string;
  apiDocs?:     string;
  version:      string;
  status:       'draft' | 'published' | 'archived';
  createdAt:    Date;
  updatedAt:    Date;
  seller:       { id: string; fullName: string; rating?: number };
  reviews:      StoreProductReview[];
}

export interface StoreProductReview {
  id:        string;
  productId: string;
  userId:    string;
  rating:    number;
  comment:   string;
  createdAt: Date;
  user?:     { fullName: string };
}

export interface StoreOrder {
  id:            string;
  userId:        string;
  items:         StoreOrderItem[];
  total:         number;
  currency:      string;
  status:        'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: 'momo' | 'usdt' | 'bank_transfer' | 'wallet';
  paymentDetails?: {
    transactionId: string;
    provider:      string;
    paidAt:        Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreOrderItem {
  productId:   string;
  productName: string;
  quantity:    number;
  price:       number;
  license?:    string;
  downloadUrl?: string;
  expiresAt?:  Date;
}

export interface StoreDigitalAsset {
  id:          string;
  productId:   string;
  userId:      string;
  licenseKey:  string;
  downloadUrl: string;
  expiresAt?:  Date;
  downloads:   number;
  activatedAt: Date;
}

export interface StoreSubscription {
  id:            string;
  userId:        string;
  productId:     string;
  status:        'active' | 'paused' | 'expired' | 'cancelled';
  startDate:     Date;
  endDate:       Date;
  autoRenew:     boolean;
  paymentMethod: string;
}

export interface StoreApiKey {
  id:        string;
  userId:    string;
  productId?: string;
  name:      string;
  key:       string;
  lastUsed?: Date;
  createdAt: Date;
}
