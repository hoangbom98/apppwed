import type { Metadata } from "next";
import InsightsClient from "./InsightsClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Insights & Resources | Fortress Investment Holdings",
  description:
    "Browse investment articles, market research, sector analysis, and strategic commentary from Fortress Investment Holdings.",
  openGraph: {
    title: "Insights & Resources | Fortress Investment Holdings",
    description:
      "Investment perspectives, market analysis, and strategic commentary from Fortress Investment Holdings.",
    type: "website",
  },
};

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      <InsightsClient />
      <Footer />
    </main>
  );
}
