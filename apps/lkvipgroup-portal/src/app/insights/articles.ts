export interface Article {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image?: string;
}

export const categoryColors: Record<string, string> = {
  "Real Estate": "border-l-fortress-gold",
  "Business Acquisitions": "border-l-blue-400",
  "Private Equity": "border-l-green-400",
  "AI & Technology": "border-l-purple-400",
  "Digital Assets & Blockchain": "border-l-orange-400",
  "Hospitality": "border-l-pink-400",
  "Trading & Distribution": "border-l-cyan-400",
  "Market Insights": "border-l-amber-400",
  "Company News": "border-l-red-400",
  "Strategic Investment Management": "border-l-teal-400",
};

export const categories = [
  { label: "Real Estate" },
  { label: "Business Acquisitions" },
  { label: "Private Equity" },
  { label: "AI & Technology" },
  { label: "Digital Assets & Blockchain" },
  { label: "Hospitality" },
  { label: "Trading & Distribution" },
  { label: "Market Insights" },
  { label: "Company News" },
  { label: "Strategic Investment Management" },
];

export const allArticles: Article[] = [];
