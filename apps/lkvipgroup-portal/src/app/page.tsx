import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Introduction from "@/components/Introduction";
import WhatWeDo from "@/components/WhatWeDo";
import InvestmentSectors from "@/components/InvestmentSectors";
import WhyChooseUs from "@/components/WhyChooseUs";
import Philosophy from "@/components/Philosophy";
import PartnershipCTA from "@/components/PartnershipCTA";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import PageTransition from "@/components/animations/PageTransition";
import { FloatingBlobs } from "@/components/animations/AnimatedBackground";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Fortress Investment Holdings is a leading Dubai-based investment firm specializing in real estate, private equity, business acquisitions, AI & technology, and hospitality.",
  openGraph: {
    title: "Home | Fortress Investment Holdings",
    description:
      "Leading Dubai-based investment firm specializing in real estate, private equity, and business acquisitions.",
  },
};

export default function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-white relative">
        <FloatingBlobs />
        <Navbar />
        <Hero />
        <Introduction />
        <WhatWeDo />
        <InvestmentSectors />
        <WhyChooseUs />
        <Philosophy />
        <PartnershipCTA />
        <Newsletter />
        <Footer />
      </main>
    </PageTransition>
  );
}
