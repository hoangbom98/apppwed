import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">404</p>
          <h1 className="text-5xl md:text-7xl font-bold text-fortress-navy mb-6">Page Not Found</h1>
          <p className="text-fortress-charcoal/60 text-lg max-w-xl mx-auto mb-10">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-sm tracking-widest hover:shadow-2xl hover:shadow-fortress-gold/25 transition-all duration-300 rounded-sm"
          >
            Back to Home
          </Link>
          <div className="mt-16 max-w-lg mx-auto bg-fortress-navy p-8 md:p-10 rounded-2xl">
            <p className="text-fortress-silver text-sm md:text-base leading-relaxed">
              If you believe this is an error, please <Link href="/contact" className="text-fortress-gold hover:underline">contact us</Link>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
