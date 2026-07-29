"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">500</p>
          <h1 className="text-5xl md:text-7xl font-bold text-fortress-navy mb-6">Unexpected Error</h1>
          <p className="text-fortress-charcoal/60 text-lg max-w-xl mx-auto mb-10">
            Something went wrong on our end. Please try again or contact us if the issue persists.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-sm tracking-widest hover:shadow-2xl hover:shadow-fortress-gold/25 transition-all duration-300 rounded-sm"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 border border-fortress-gold text-fortress-gold font-bold text-sm tracking-widest hover:bg-fortress-gold/10 transition-all duration-300 rounded-sm"
            >
              Back to Home
            </Link>
          </div>
          <div className="mt-16 max-w-lg mx-auto bg-fortress-navy p-8 md:p-10 rounded-2xl">
            <p className="text-fortress-silver text-sm md:text-base leading-relaxed">
              If this continues, please <Link href="/contact" className="text-fortress-gold hover:underline">contact our team</Link>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
