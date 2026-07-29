import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InvestorForm from "@/components/InvestorForm";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invest With Fortress | Fortress Investment Holdings",
  description:
    "Invest with Fortress Investment Holdings. Allocate capital across carefully selected opportunities in the UAE, GCC, and international markets with disciplined risk management.",
  openGraph: {
    title: "Invest With Fortress | Fortress Investment Holdings",
    description:
      "Your capital deserves discipline, access, and enduring value. Invest with Fortress.",
  },
};

const investmentCards = [
  "Diversified Sector Access",
  "Opportunity Evaluation",
  "Strategic Capital Allocation",
  "Active Investment Management",
  "Risk-Focused Decisions",
  "Long-Term Value Creation",
];

const sectorCards = [
  "Real Estate",
  "Business Acquisitions",
  "Private Equity",
  "AI & Emerging Technology",
  "Hospitality",
  "Digital Assets & Blockchain",
  "Energy & Physical Commodities",
  "Luxury Assets",
  "Strategic Ventures",
];

const modelSteps = [
  {
    title: "Understand Your Objectives",
    body: "Every mandate begins with you. We define your priorities, capital range, preferred sectors, time horizon, and risk profile before a single decision is made.",
  },
  {
    title: "Define the Investment Strategy",
    body: "We translate your objectives into a clear investment approach and participation structure, agreed with you, documented, and adhered to throughout.",
  },
  {
    title: "Identify Qualified Opportunities",
    body: "We source businesses, assets, and projects through our regional and international networks, and pursue only those that meet our standards.",
  },
  {
    title: "Conduct Rigorous Due Diligence",
    body: "Commercial fundamentals, risk exposure, legal standing, and execution capability are scrutinised before any capital is committed.",
  },
  {
    title: "Structure and Deploy Capital",
    body: "Participation is structured to align interests and protect your position, with capital deployed only into approved opportunities.",
  },
  {
    title: "Manage, Monitor, Report",
    body: "Our involvement does not end at deployment. We actively review performance, support execution, and remain accountable for long-term value creation.",
  },
];

const featureList = [
  "Strategic Guidance",
  "Governance Support",
  "Commercial Development",
  "Operational Oversight",
  "Regional Market Access",
  "Performance Monitoring",
];

const investorTypes = [
  "Private Investors",
  "High-Net-Worth Individuals",
  "Family Offices",
  "Corporate Investors",
  "Financial Institutions",
  "Institutional Capital",
];

const capitalTypes = [
  "Direct Investment",
  "Diversified Allocation",
  "Co-Investment",
  "Project-Based Investment",
  "Sector-Specific Investment",
  "Long-Term Capital Participation",
];

export default function InvestWithFortressPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden bg-white text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Invest With Fortress</p>
            <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="text-fortress-navy">Your Capital Deserves<br />Discipline, Access &amp;<br /></span>
              <span className="bg-gradient-to-r from-fortress-gold to-fortress-champagne bg-clip-text text-transparent">
                Enduring Value.
              </span>
            </h1>
            <p className="text-fortress-charcoal/70 text-sm md:text-lg leading-relaxed max-w-3xl mx-auto">
              Fortress Investment Holdings works with investors to allocate capital across carefully selected opportunities in the UAE, GCC, and international markets. We identify, evaluate, structure, and actively manage investments with a disciplined focus on responsible risk management and long-term value creation.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <a
                href="#enquiry"
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-xs md:text-sm tracking-widest hover:shadow-2xl hover:shadow-fortress-gold/25 transition-all duration-300 rounded-sm"
              >
                Submit Investor Enquiry
              </a>
              <a
                href="#sectors"
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 border border-fortress-gold text-fortress-gold font-bold text-xs md:text-sm tracking-widest hover:bg-fortress-gold/10 transition-all duration-300 rounded-sm"
              >
                Explore Investment Sectors
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* For Investors */}
      <section className="py-12 md:py-20 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl" id="invest">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">For Investors</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">Your Capital. Our Discipline. A Shared Commitment to Growth.</h2>
            <p className="text-fortress-silver text-sm md:text-lg leading-relaxed mb-8 md:mb-10">
              When you invest with Fortress, capital is allocated only after we understand your objectives, preferred sectors, capital range, time horizon, and risk tolerance. We then build an investment strategy around those priorities and consider only opportunities that meet our evaluation standards. Your objectives define the strategy; our disciplined approach guides its execution.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {investmentCards.map((item, i) => (
              <div key={i} className="p-4 md:p-5 bg-fortress-deep border border-fortress-gold/10 rounded-sm">
                <p className="text-fortress-silver text-xs md:text-sm leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diversified Investment Access */}
      <section className="py-12 md:py-20 my-8 md:my-12 sm:mx-4 rounded-2xl bg-white" id="sectors">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Diversified Investment Access</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-navy mb-4 md:mb-6">One Relationship. Access to Multiple Asset Classes.</h2>
            <p className="text-fortress-charcoal/70 text-sm md:text-lg leading-relaxed mb-8 md:mb-10">
              Diversification can help investors manage concentration risk and access opportunities across different sectors. Through a single relationship with Fortress, investors may gain exposure to established and emerging sectors, with capital allocated according to individual objectives, suitability, and the strength of available opportunities.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {sectorCards.map((item, i) => (
              <div key={i} className="p-4 md:p-5 bg-fortress-navy border border-fortress-gold/10 rounded-sm">
                <p className="text-fortress-silver text-xs md:text-sm leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-fortress-charcoal/40 text-xs md:text-sm mt-6 max-w-2xl mx-auto">
            All investments are subject to evaluation, suitability, availability, agreed terms, and applicable regulatory requirements.
          </p>
        </div>
      </section>

      {/* The Fortress Investment Model */}
      <section className="py-12 md:py-20 bg-fortress-deep my-8 md:my-12 sm:mx-4 rounded-2xl" id="model">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">The Fortress Investment Model</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">A Disciplined Path from Commitment to Value</h2>
            <p className="text-fortress-ivory/80 text-sm md:text-lg leading-relaxed mb-8 md:mb-10">
              Successful investing is built on process. Every mandate at Fortress moves through six deliberate stages designed to assess opportunities carefully, manage risk responsibly, and support long-term value creation.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {modelSteps.map((step, i) => (
              <div key={i} className="p-5 md:p-6 bg-fortress-navy border border-fortress-gold/20 rounded-sm">
                <span className="text-fortress-gold text-[10px] md:text-xs font-medium tracking-[3px] uppercase block mb-3 md:mb-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-fortress-ivory text-sm md:text-base font-bold mb-2">{step.title}</h3>
                <p className="text-fortress-silver/80 text-xs md:text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Investment Management */}
      <section className="py-12 md:py-20 my-8 md:my-12 sm:mx-4 rounded-2xl bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 md:gap-16 items-center">
            <div className="lg:col-span-2">
              <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Active Investment Management</p>
              <h2 className="text-xl md:text-4xl font-bold text-fortress-navy mb-4 md:mb-6">We Don&rsquo;t Just Allocate Capital. We Stand Behind It.</h2>
              <p className="text-fortress-charcoal/70 text-sm md:text-base leading-relaxed mb-4">
                Many firms deploy capital and step back. Fortress stays engaged, providing strategic guidance, governance support, commercial development, and operational oversight, reinforced by access to our regional and international networks.
              </p>
              <p className="text-fortress-charcoal/70 text-sm md:text-base leading-relaxed">
                This hands-on involvement exists for one reason: to strengthen performance and build durable value at every stage of the investment lifecycle, because disciplined execution remains central to our mandate.
              </p>
            </div>
            <div className="lg:col-span-3 bg-fortress-navy p-6 md:p-10 rounded-2xl">
              <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">How We Add Value</p>
              <h2 className="text-xl md:text-3xl font-bold text-fortress-ivory mb-6 md:mb-8">Engaged Ownership, Long After the Investment Is Made</h2>
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                {featureList.map((item, i) => (
                  <div key={i} className="p-4 md:p-5 bg-fortress-deep border border-fortress-gold/10 rounded-sm">
                    <p className="text-fortress-ivory text-xs md:text-sm font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Work With */}
      <section className="py-12 md:py-20 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Who We Work With</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">For Investors with a Long-Term Outlook</h2>
            <p className="text-fortress-silver text-sm md:text-lg leading-relaxed mb-8 md:mb-10">
              Fortress works with a select group of investors who value discipline over speculation, from private individuals building diversified exposure to institutions deploying structured capital across the UAE, GCC, and international markets.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {investorTypes.map((item, i) => (
              <div key={i} className="p-4 md:p-5 bg-fortress-deep border border-fortress-gold/10 rounded-sm">
                <p className="text-fortress-silver text-xs md:text-sm leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Capital */}
      <section className="py-12 md:py-20 bg-fortress-deep my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Investment Capital</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">Structured Around You, Not the Other Way Around</h2>
            <p className="text-fortress-ivory/80 text-sm md:text-lg leading-relaxed mb-8 md:mb-10">
              No two investors are identical, and no two mandates at Fortress are either. Participation is structured around the opportunity, your objectives, your capital commitment, and your risk profile, under terms agreed transparently before any capital moves.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {capitalTypes.map((item, i) => (
              <div key={i} className="p-4 md:p-5 bg-fortress-navy border border-fortress-gold/10 rounded-sm">
                <p className="text-fortress-silver text-xs md:text-sm leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-12 md:py-20 my-8 md:my-12 sm:mx-4 rounded-2xl bg-fortress-navy">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 text-center">
          <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Begin Your Investment Journey</p>
          <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">The First Step Is a Conversation, Not a Commitment</h2>
          <p className="text-fortress-silver text-sm md:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Tell us about your investment objectives, preferred sectors, capital range, and time horizon. Our team will review your enquiry in confidence and present opportunities genuinely suited to your profile, with no obligation to proceed.
          </p>
          <a
            href="#enquiry"
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-xs md:text-sm tracking-widest hover:shadow-2xl hover:shadow-fortress-gold/25 transition-all duration-300 rounded-sm"
          >
            Submit Investor Enquiry
          </a>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 md:py-20 bg-white my-8 md:my-12 sm:mx-4 rounded-2xl" id="enquiry">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 md:gap-16">
            <div className="lg:col-span-2">
              <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Submit Your Investor Enquiry</p>
              <h2 className="text-xl md:text-4xl font-bold text-fortress-navy mb-4 md:mb-6">Start the Conversation with Fortress</h2>
              <p className="text-fortress-charcoal/70 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
                Share your investment objectives and preferences below. A member of our investment team will review your enquiry personally and respond within two to three business days, in strict confidence, and with no obligation on your part.
              </p>
              <div className="space-y-3 md:space-y-4">
                {[
                  "Handled in strict confidence",
                  "Reviewed by our investment team, not an automated process",
                  "No obligation to proceed at the enquiry stage",
                  "Personal response within 2–3 business days",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-fortress-gold flex-shrink-0" />
                    <span className="text-fortress-charcoal/60 text-xs md:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-fortress-navy border border-fortress-gold/10 p-6 md:p-10 rounded-2xl">
                <InvestorForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confidentiality Note */}
      <section className="py-12 md:py-20 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">Confidentiality</p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">Your Information Is Protected</h2>
            <p className="text-fortress-silver text-sm md:text-base leading-relaxed">
              Information submitted through this website is reviewed solely for the purpose of assessing a potential investment opportunity. Submission of information does not automatically establish a confidential, advisory, partnership, or investment relationship. Parties requiring a formal non-disclosure agreement should contact our team before submitting sensitive information.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

