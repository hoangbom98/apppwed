import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Eye, Target, Award, Users, Scale, Lock, Hexagon, Heart } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Fortress Investment Holdings is a Dubai-based diversified investment holding company. Learn about our vision, mission, values, and leadership.",
  openGraph: {
    title: "About Us | Fortress Investment Holdings",
    description:
      "Learn about our vision, mission, values, and leadership.",
  },
};

const values = [
  { icon: Shield, title: "Integrity", description: "We conduct business honestly, responsibly, and transparently  in every transaction, without exception." },
  { icon: Hexagon, title: "Strength", description: "We make decisions with discipline, confidence, and careful consideration. Conviction matters; so does knowing when to walk away." },
  { icon: Eye, title: "Vision", description: "We look beyond immediate returns to identify long-term value and future potential others may overlook." },
  { icon: Users, title: "Partnership", description: "We build relationships based on trust, respect, alignment, and shared objectives. Our partners' success is our success." },
  { icon: Award, title: "Excellence", description: "We hold ourselves to high standards across every investment, partnership, and business interaction." },
  { icon: Scale, title: "Accountability", description: "We take full responsibility for our decisions, commitments, and performance. We do what we say." },
  { icon: Lock, title: "Confidentiality", description: "We protect the information, interests, and privacy of our partners and stakeholders  always." },
  { icon: Heart, title: "Client-Centricity", description: "We place clients at the centre of every decision, focusing on trust, transparency, and long-term value creation." },
];

const philosophyPoints = [
  "Genuine market demand  customers who need the product, not a story that needs customers",
  "Clear commercial potential  a realistic path to profitable growth",
  "Responsible leadership  capable, ethical management teams",
  "Scalable operations  the ability to grow without breaking",
  "Defensible competitive advantages  reasons the business wins, and keeps winning",
  "Transparent financial information  clean numbers, honestly presented",
  "Realistic growth opportunities  ambition anchored in evidence",
  "Alignment between stakeholders  everyone pulling in the same direction",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Banner */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden bg-white text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <Reveal className="max-w-3xl mx-auto">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">About Us</p>
            <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="text-fortress-navy">Built to Protect. </span>
              <span className="bg-gradient-to-r from-fortress-gold to-fortress-champagne bg-clip-text text-transparent">
                Positioned to Grow.
              </span>
            </h1>
            <p className="text-fortress-charcoal/70 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto">
              Fortress Investment Holdings brings together disciplined capital, strategic thinking, and long-term vision to build sustainable value across selected businesses, assets, and markets.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="py-12 md:py-20 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <Reveal className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">About Fortress Investment Holdings</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">
              A Platform Built for Long-Term Value
            </h2>
            <p className="text-fortress-silver text-sm md:text-lg leading-relaxed">
              Fortress Investment Holdings is a diversified investment holding company headquartered in Dubai, United Arab Emirates. We identify valuable opportunities, invest responsibly, and support businesses with genuine potential for sustainable growth.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-12 md:py-20 my-8 md:my-12 sm:mx-4 rounded-2xl bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <Stagger className="grid md:grid-cols-2 gap-6 md:gap-12">
            <StaggerItem className="bg-fortress-navy border border-fortress-gold/10 p-6 md:p-10 rounded-2xl">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-fortress-gold/10 flex items-center justify-center mb-4 md:mb-6 rounded-sm">
                <Eye className="w-6 h-6 md:w-7 md:h-7 text-fortress-gold" />
              </div>
              <p className="text-fortress-gold text-sm font-medium tracking-[4px] uppercase mb-3">Our Vision</p>
              <h3 className="text-lg md:text-2xl font-bold text-fortress-ivory mb-3 md:mb-4">To Build a Globally Respected, Client-Centric Investment Group</h3>
              <p className="text-fortress-silver text-sm md:text-base leading-relaxed">
                Our vision is to establish Fortress Investment Holdings as a trusted, diversified, and internationally recognised investment group built around client confidence, disciplined growth, and long-term value creation. We measure success by the strength of our portfolio and the trust we build with every client and partner.
              </p>
            </StaggerItem>
            <StaggerItem className="bg-fortress-deep border border-fortress-gold/10 p-6 md:p-10 rounded-2xl">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-fortress-gold/10 flex items-center justify-center mb-4 md:mb-6 rounded-sm">
                <Target className="w-6 h-6 md:w-7 md:h-7 text-fortress-gold" />
              </div>
              <p className="text-fortress-gold text-sm font-medium tracking-[4px] uppercase mb-3">Our Mission</p>
              <h3 className="text-lg md:text-2xl font-bold text-fortress-ivory mb-3 md:mb-4">Investing with Strength. Serving with Trust. Creating Lasting Value.</h3>
              <p className="text-fortress-silver text-sm md:text-base leading-relaxed">
                Our mission is to identify high-potential opportunities, deploy capital responsibly, and support sustainable growth through strategic involvement, strong governance, and long-term partnerships. We place clients at the centre of every decision, focusing on transparency, trust, and value-driven outcomes.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-12 md:py-20 bg-fortress-deep my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <Reveal className="text-center mb-8 md:mb-12">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Leadership</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory">Leadership Built on Vision and Responsibility</h2>
          </Reveal>
          <Stagger className="grid lg:grid-cols-2 gap-6 md:gap-12">
            <StaggerItem className="group bg-gradient-to-br from-fortress-navy to-fortress-charcoal border border-fortress-gold/10 p-6 md:p-10 rounded-2xl transition-all duration-500 hover:border-fortress-gold/40 hover:shadow-2xl hover:shadow-fortress-gold/10 hover:-translate-y-1">
              <div className="relative w-full aspect-[4/5] mb-6 overflow-hidden rounded-lg">
                <Image src="/Azzam-El-Khatib.jpeg" alt="Azzam El-Khatib" fill className="object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-fortress-ivory mb-1 transition-colors duration-500 group-hover:text-fortress-gold">Azzam El-Khatib</h3>
              <p className="text-fortress-gold text-sm font-medium mb-4 md:mb-6">Founder and Chief Executive Officer</p>
              <div className="space-y-3 md:space-y-4 text-fortress-silver text-sm md:text-base leading-relaxed">
                <p>Azzam El-Khatib leads Fortress Investment Holdings with a strong commitment to disciplined growth, client service, and responsible investment management.</p>
                <p>With an extensive network across the UAE, GCC and international markets, Azzam plays a central role in building strategic relationships, identifying investment opportunities, and driving the company&rsquo;s long-term vision.</p>
                <p>His leadership is defined by discipline, accountability, and a client-first approach. He is committed to protecting clients&rsquo; interests, creating sustainable value, and delivering strong, well-considered returns on every investment.</p>
              </div>
            </StaggerItem>
            <StaggerItem className="group bg-gradient-to-br from-fortress-navy to-fortress-charcoal border border-fortress-gold/10 p-6 md:p-10 rounded-2xl transition-all duration-500 hover:border-fortress-gold/40 hover:shadow-2xl hover:shadow-fortress-gold/10 hover:-translate-y-1">
              <div className="relative w-full aspect-[4/5] mb-6 overflow-hidden rounded-lg">
                <Image src="/Serhii-Pohrebniak.jpeg" alt="Serhii Pohrebniak" fill className="object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-fortress-ivory mb-1 transition-colors duration-500 group-hover:text-fortress-gold">Serhii Pohrebniak</h3>
              <p className="text-fortress-gold text-sm font-medium mb-4 md:mb-6">Business Strategist</p>
              <div className="space-y-3 md:space-y-4 text-fortress-silver text-sm md:text-base leading-relaxed">
                <p>Serhii Pohrebniak is a key member of Fortress Investment Holdings and one of the strategic minds behind the company&rsquo;s vision and direction. With a military background, he brings discipline, resilience, structure, and a strong sense of responsibility to every aspect of the business.</p>
                <p>His diverse life and business experiences allow him to approach challenges with clarity, practical thinking, and a long-term perspective. Serhii plays an important role in shaping business strategies, identifying opportunities, and supporting the company&rsquo;s growth.</p>
                <p>He strongly believes that meaningful goals are achieved through consistency, discipline, and focused action. This philosophy forms the foundation of his approach to both business and life.</p>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 md:py-20 my-8 md:my-12 sm:mx-4 rounded-2xl bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <Reveal className="text-center mb-10 md:mb-16">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Our Values</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-navy">The Principles Behind Every Decision</h2>
          </Reveal>
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {values.map((v) => (
              <StaggerItem key={v.title} className="bg-fortress-navy border border-fortress-gold/10 p-6 md:p-8 hover:border-fortress-gold/30 hover:shadow-xl hover:shadow-fortress-gold/5 hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-fortress-gold/10 flex items-center justify-center mb-4 md:mb-5 rounded-sm">
                  <v.icon className="w-5 h-5 md:w-6 md:h-6 text-fortress-gold" />
                </div>
                <h3 className="text-fortress-ivory font-bold text-base md:text-lg mb-2 md:mb-3">{v.title}</h3>
                <p className="text-fortress-silver text-xs md:text-sm leading-relaxed">{v.description}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Investment Philosophy */}
      <section className="py-12 md:py-20 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <Reveal className="text-center mb-8 md:mb-12">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Our Investment Philosophy</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-3 md:mb-4">Disciplined Capital. Strategic Growth.</h2>
            <p className="text-fortress-ivory/80 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto">
              Sustainable value begins with strong fundamentals. Everything else is noise.
            </p>
          </Reveal>
          <Stagger className="grid sm:grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto">
            {philosophyPoints.map((point, i) => (
              <StaggerItem key={i} className="p-4 md:p-5 bg-fortress-deep border border-fortress-gold/10 rounded-sm transition-all duration-300 hover:border-fortress-gold/30 hover:shadow-lg hover:shadow-fortress-gold/5 hover:-translate-y-0.5">
                <p className="text-fortress-silver text-xs md:text-sm leading-relaxed">{point}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <Footer />
    </main>
  );
}
