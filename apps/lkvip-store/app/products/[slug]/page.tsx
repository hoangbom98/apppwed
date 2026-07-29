"use client";

import { useParams } from "next/navigation";
import { useProductDetail } from "@/hooks/useStore";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ProductDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProductDetail(slug);
  const { addItem } = useCartStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--store-primary) transparent transparent transparent" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <p style={{ color: "var(--store-muted)" }}>Sản phẩm không tồn tại</p>
        <Link href="/products" className="text-sm font-semibold" style={{ color: "var(--store-primary)" }}>← Xem tất cả sản phẩm</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    toast.success("Đã thêm vào giỏ hàng!");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden" style={{ background: "#e8f0fe", minHeight: 240 }}>
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} className="w-full h-60 object-cover" />
            : <div className="h-60 flex items-center justify-center" style={{ color: "var(--store-muted)" }}>No image</div>
          }
        </div>
        <div>
          <h1 className="text-2xl font-black mb-2">{product.name}</h1>
          <p className="text-sm mb-4" style={{ color: "var(--store-muted)" }}>{product.shortDescription}</p>
          <p className="text-2xl font-bold mb-6" style={{ color: "var(--store-primary)" }}>
            {product.price?.amount > 0
              ? `${Number(product.price.amount).toLocaleString("vi")} ${product.price.currency}`
              : "Miễn phí"}
          </p>
          <button onClick={handleAddToCart}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "var(--store-primary)" }}>
            <ShoppingCart size={18} /> Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
}
