import type { Metadata } from "next";
import HomePage from "@/pages/HomePage";

export const metadata: Metadata = {
  title: "LKVIP Store — Marketplace dịch vụ số & tài nguyên kỹ thuật số",
  description: "Mua bán dịch vụ số, source code, templates, API và khoá học trực tuyến từ LKVIP Group.",
  openGraph: {
    title: "LKVIP Store",
    description: "Marketplace dịch vụ số & tài nguyên kỹ thuật số",
    type: "website",
  },
};

export default function Page() {
  return <HomePage />;
}
