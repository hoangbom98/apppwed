import type { Metadata } from "next";
import ProductsPage from "@/pages/ProductsPage";

export const metadata: Metadata = {
  title: "Sản phẩm — LKVIP Store",
  description: "Khám phá toàn bộ sản phẩm số: dịch vụ, source code, templates, API và khoá học.",
};

export default function Page() {
  return <ProductsPage />;
}
