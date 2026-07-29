import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import {
  Building2,
  Cpu,
  Briefcase,
  TrendingUp,
  UtensilsCrossed,
  Wifi,
  Truck,
  Gem,
  Handshake,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investment Focus",
  description:
    "Explore Fortress Investment Holdings' investment sectors: real estate, digital assets, business acquisitions, private equity, hospitality, AI & technology, trading, luxury assets, and strategic partnerships.",
  openGraph: {
    title: "Investment Focus | Fortress Investment Holdings",
    description:
      "Explore our diversified investment sectors across the UAE and beyond.",
  },
};

const sectors = [
  {
    id: "real-estate",
    icon: Building2,
    title: "Real Estate",
    subtitle: "Building Value Through Strategic Property Investment",
    image: "/1.png",
    body: "The UAE remains our primary real estate market, supported by strong population growth, investor-friendly regulations, world-class infrastructure, and sustained international demand. While our main focus is on identifying high-quality opportunities across the UAE, we also consider selected real estate investments in established and emerging international markets where the fundamentals, growth potential, and risk profile align with our investment strategy.",
    items: [
      { heading: "Residential Real Estate", desc: "Apartments, villas, and communities in high-demand locations across the UAE and selected global markets." },
      { heading: "Commercial Real Estate", desc: "Offices, retail spaces, and mixed-use assets with strong occupancy potential and reliable income profiles." },
      { heading: "Hospitality Real Estate", desc: "Hotels, resorts, serviced residences, and hospitality-led developments in strategic destinations." },
      { heading: "Industrial & Logistics", desc: "Warehousing, distribution facilities, logistics hubs, and supply-chain infrastructure." },
      { heading: "Development & Land", desc: "Well-positioned land parcels and development projects supported by strong fundamentals and credible execution plans." },
      { heading: "Income-Generating Assets", desc: "Stabilised properties capable of delivering consistent rental income and long-term value." },
    ],
    closing:
      "Our real estate interests include direct acquisitions, development partnerships, land opportunities, structured investments, and project participation. The UAE remains at the centre of our strategy, while carefully selected international opportunities allow us to diversify and access additional growth markets. In every investment, we prioritise quality, location, market fundamentals, responsible development, and sustainable long-term returns over short-term speculation.",
  },
  {
    id: "business-acquisitions",
    icon: Briefcase,
    title: "Business Acquisitions",
    subtitle:
      "We acquire and invest in established businesses with strong foundations and clear potential for sustainable growth.",
    image: "/3.png",
    body: "Behind every established business is years of effort, relationships, and market knowledge. We respect that legacy and approach every transaction with professionalism, discretion, and long-term intent.\n\nWe consider businesses with proven operations, reliable customer demand, experienced management, and opportunities to improve performance or expand into new markets.",
    items: [
      { heading: "Full Business Acquisitions", desc: "Complete ownership transitions managed professionally and discreetly." },
      { heading: "Majority Ownership", desc: "Controlling positions with continued founder or management participation." },
      { heading: "Minority Strategic Investments", desc: "Meaningful stakes supported by active strategic involvement." },
      { heading: "Management Buyouts", desc: "Backing capable leadership teams to acquire and grow the businesses they manage." },
      { heading: "Joint Acquisitions", desc: "Partnerships with co-investors on larger or specialised opportunities." },
      { heading: "Succession Transactions", desc: "Structured solutions for owners planning a responsible and orderly exit." },
      { heading: "Growth Capital Partnerships", desc: "Investment combined with strategic support for expansion and development." },
    ],
    closing:
      "Our primary focus is the UAE, while we also evaluate selected opportunities across the GCC and international markets. Through active involvement, disciplined management, and strategic support, we aim to strengthen operations, expand market reach, and create lasting value for all stakeholders.",
  },
  {
    id: "private-equity",
    icon: TrendingUp,
    title: "Private Equity",
    subtitle: "Supporting High-Potential Private Companies",
    image: "/4.png",
    body: "The most valuable companies of the next decade are private today. Finding them  and helping them grow  is what our private equity activity is built for.",
    items: [
      "Growth capital  funding expansion, product development, and market entry",
      "Strategic support  board-level guidance and commercial direction",
      "Market access  introductions across our UAE and international networks",
      "Governance guidance  structures that build institutional credibility",
      "Business development resources  practical support that accelerates growth",
    ],
    closing:
      "Our objective is straightforward: build value alongside founders, management teams, and shareholders  not at their expense.",
  },
  {
    id: "ai-technology",
    icon: Wifi,
    title: "AI & Emerging Technology",
    subtitle: "Investing in the Future of Intelligent Innovation",
    image: "/6.png",
    body: "We invest in artificial intelligence and emerging technology companies that have the potential to transform industries, improve efficiency, and create scalable commercial value.\n\nOur focus is on practical, high-growth technologies that solve real business problems, support digital transformation, and create long-term value across the UAE, GCC, and global markets.",
    items: [
      { heading: "Artificial Intelligence", desc: "AI platforms, automation systems, machine learning solutions, and intelligent tools with clear commercial use." },
      { heading: "Business Automation", desc: "Technologies that improve productivity, reduce operational costs, and enhance business performance." },
      { heading: "Software & SaaS Platforms", desc: "Scalable software businesses with recurring revenue models and strong market demand." },
      { heading: "FinTech", desc: "Digital payment solutions, lending platforms, financial infrastructure, and technology improving access to financial services." },
      { heading: "PropTech", desc: "Real estate technology supporting smarter property investment, sales, leasing, management, and market intelligence." },
      { heading: "Cybersecurity", desc: "Solutions that protect businesses, data, digital infrastructure, and online transactions." },
      { heading: "Data Analytics", desc: "Platforms that turn data into insights, helping businesses make faster and better decisions." },
      { heading: "Digital Commerce", desc: "E-commerce, marketplace platforms, and technology-driven retail businesses with growth potential." },
    ],
    closing:
      "We invest in technology with purpose, businesses that combine innovation, strong execution, market demand, and a clear path to long-term commercial growth.",
  },
  {
    id: "hospitality",
    icon: UtensilsCrossed,
    title: "Hospitality",
    subtitle: "Investing in Experiences, Tourism, and Lifestyle",
    image: "/5.png",
    body: "The UAE remains our primary focus, supported by selective opportunities across the GCC and global markets. With strong tourism demand, world-class infrastructure, and a growing lifestyle economy, the region continues to offer attractive hospitality investment potential.",
    items: [
      { heading: "Hotels & Resorts", desc: "Established hospitality assets and credible development projects with strong location, demand, and operational potential." },
      { heading: "Serviced Apartments & Holiday Homes", desc: "High-demand short and medium-stay accommodation opportunities, especially in markets with strong tourism and business travel." },
      { heading: "Restaurants & Food Concepts", desc: "Proven dining concepts with strong brand identity, clear unit economics, and potential for expansion." },
      { heading: "Leisure & Tourism Experiences", desc: "Attractions, experiences, and tourism-related businesses serving residents, visitors, and international travellers." },
      { heading: "Wellness Concepts", desc: "Health, fitness, spa, and wellbeing businesses with strong customer demand and repeat revenue potential." },
      { heading: "Hospitality Technology", desc: "Technology platforms that improve how hospitality businesses operate, serve customers, manage bookings, and increase efficiency." },
      { heading: "Luxury Lifestyle Services", desc: "Premium services for residents, tourists, business travellers, and high-net-worth clients." },
    ],
    closing:
      "We focus on hospitality concepts with strong market positioning, professional operations, and the ability to deliver consistent customer value across the UAE, with potential for GCC and global expansion.",
  },
  {
    id: "digital-assets",
    icon: Cpu,
    title: "Digital Assets & Blockchain",
    subtitle: "Selective Participation in the Digital Economy",
    image: "/2.png",
    body: "Blockchain and digital assets are reshaping how value is created, transferred, and secured. In the UAE  one of the world's most progressive jurisdictions for digital asset regulation  this shift is creating serious, long-term commercial opportunities.\n\nFortress Investment Holdings participates in this space the same way we approach every sector: selectively, responsibly, and with a clear focus on real-world utility over hype.\n\nWe are not traders chasing market cycles. We are long-term investors backing the infrastructure, platforms, and businesses building the digital economy's foundations.",
    items: [
      "Blockchain Infrastructure  networks, protocols, and enterprise-grade systems powering secure digital transactions",
      "Digital Asset Platforms  regulated exchanges, custody solutions, and asset-management technology",
      "Tokenisation  real-world asset tokenisation, including real estate, funds, and commodities",
      "Financial Technology (Fintech)  payment systems, digital banking, and blockchain-enabled financial services",
      "Web3 & Enterprise Solutions  businesses applying distributed ledger technology to genuine commercial challenges",
    ],
    subheading: "How We Evaluate Digital Asset Opportunities",
    subitems: [
      "Regulatory Alignment  compliance with UAE frameworks including VARA, and awareness of international standards",
      "Genuine Utility  technology that solves a real market problem, not a speculative narrative",
      "Security & Custody  robust cybersecurity, transparent custody arrangements, responsible governance",
      "Commercial Viability  a clear revenue model, credible leadership, and a realistic path to scale",
      "Long-Term Relevance  businesses positioned to perform beyond short-term market sentiment",
    ],
    disclaimer:
      "Fortress Investment Holdings does not promote short-term speculation or guarantee returns from digital assets.",
  },
  {
    id: "energy-commodities",
    icon: Truck,
    title: "Energy & Physical Commodities",
    subtitle: "Investing in Essential Resources and Global Trade Flow",
    image: "/7.png",
    body: "Energy and physical commodities remain essential to global growth, industrial development, infrastructure, and everyday economic activity.\n\nFortress Investment Holdings focuses on opportunities connected to real, tangible commodities, including energy products, raw materials, and physical goods with genuine demand across regional and global markets.",
    items: [
      "Energy Products: opportunities connected to crude oil, refined petroleum products, fuel supply, and energy-related trade",
      "Physical Commodities: tangible goods such as metals, minerals, agricultural products, construction materials, and other high-demand physical resources",
      "Supply & Distribution Networks: businesses with established sourcing, logistics, storage, and distribution capabilities",
      "Reliable Trade Partners: strong supplier and buyer relationships with clear documentation, compliance, and delivery capacity",
      "Regional & Global Demand: commodities with active demand across the UAE, GCC, Africa, Asia, and international markets",
      "Operational Strength: businesses with proven trade flow, strong margins, risk controls, and transparent execution",
    ],
    closing:
      "We focus on physical commodity opportunities backed by real demand, reliable supply chains, disciplined execution, and strong regional or global market potential.",
  },
  {
    id: "luxury-assets",
    icon: Gem,
    title: "Luxury Assets",
    subtitle:
      "Investing in High-Value Lifestyle and Premium Asset Opportunities",
    image: "/8.png",
    body: "Fortress Investment Holdings invests in selected luxury asset opportunities with strong market demand, long-term value potential, and clear ownership or commercial structures.\n\nOur focus is on premium assets and luxury-linked businesses that can generate value through appreciation, income, rental demand, brand strength, or strategic market positioning.",
    items: [
      { heading: "Luxury Real Estate", desc: "Trophy properties, premium developments, branded residences, and high-value real estate assets in prime locations." },
      { heading: "High-Value Vehicles", desc: "Rare, collectible, and premium automobiles with strong demand, scarcity value, or rental income potential." },
      { heading: "Yachts & Marine Assets", desc: "Yacht ownership, charter opportunities, marine services, and asset-management platforms connected to the luxury lifestyle market." },
      { heading: "Aviation-Related Assets", desc: "Private aviation opportunities, aircraft-related services, aviation support businesses, and premium mobility solutions." },
      { heading: "Collectibles & Fine Art", desc: "Selected collectibles, fine art, watches, jewellery, and rare assets with established provenance and market depth." },
      { heading: "Premium Lifestyle Businesses", desc: "Luxury brands and service businesses catering to high-net-worth clients, tourists, executives, and premium lifestyle consumers." },
      { heading: "Luxury Rental & Asset-Management Platforms", desc: "Businesses that monetise premium assets through rentals, leasing, management, memberships, or curated client access." },
    ],
    closing:
      "We invest selectively in luxury assets and premium lifestyle opportunities where valuation, demand, liquidity, ownership costs, and long-term return potential are carefully assessed.",
  },
  {
    id: "strategic-investment-management",
    icon: Handshake,
    title: "Strategic Investment Management",
    subtitle: "Disciplined Capital Allocation. Sustainable Value Creation.",
    image: "/9.png",
    body: "We identify and manage carefully selected investment opportunities across multiple sectors, with a disciplined focus on risk management, income potential, and long-term capital growth.\n\nOur approach is designed for investors seeking professionally managed participation in businesses, projects, and assets across the UAE, GCC, and selected global markets.",
    items: [
      { heading: "Diversified Investment Allocation", desc: "Allocating capital across selected sectors and opportunities to create a balanced investment portfolio." },
      { heading: "Income-Generating Opportunities", desc: "Identifying investments with the potential to generate recurring income and structured distributions." },
      { heading: "Capital Growth Investments", desc: "Investing in businesses, projects, and assets with strong commercial fundamentals and long-term appreciation potential." },
      { heading: "Private Market Opportunities", desc: "Providing access to carefully evaluated opportunities beyond traditional public markets." },
    ],
    closing: "",
  },
];

export default function InvestmentFocusPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Banner */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-24 overflow-hidden bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">
              Investment Focus
            </p>
            <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6">
              <span className="text-fortress-navy">Investing Across </span>
              <span className="bg-gradient-to-r from-fortress-gold to-fortress-champagne bg-clip-text text-transparent">
                Opportunity
              </span>
            </h1>
            <p className="text-fortress-charcoal/70 text-base md:text-xl leading-relaxed max-w-2xl mx-auto">
              Fortress Investment Holdings invests across selected sectors where
              long-term demand, strong fundamentals, and strategic involvement
              create sustainable value.
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 md:py-20 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">
              A Diversified Investment Portfolio
            </p>
            <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">
              Sectors We Invest In
            </h2>
            <p className="text-fortress-ivory/80 text-sm md:text-lg leading-relaxed">
              Diversification is central to our investment strategy but
              diversification without discipline is just distraction.
            </p>
            <p className="text-fortress-silver text-sm md:text-base leading-relaxed mt-3 md:mt-4">
              We assess opportunities across a deliberate range of industries
              while maintaining a rigorous selection process. Every investment
              must demonstrate clear commercial potential, manageable risk, and
              genuine alignment with the long-term objectives of Fortress
              Investment Holdings.
            </p>
            <p className="text-fortress-silver/70 text-sm md:text-base leading-relaxed mt-3 md:mt-4">
              These are the sectors where we focus our capital and attention.
            </p>
          </div>
        </div>
      </section>

      {/* Sector Sections */}
      {sectors.map((sector, index) => (
        <section
          key={sector.title}
          id={sector.id}
          className={`py-12 md:py-28 my-8 md:my-12 sm:mx-4 rounded-2xl ${index % 2 === 1 ? "bg-fortress-deep" : "bg-white"}`}
        >
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            {/* Header */}
            <div className="flex items-start gap-4 md:gap-5 mb-8 md:mb-10">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-fortress-gold/10 flex items-center justify-center flex-shrink-0 rounded-sm">
                <sector.icon className="w-5 h-5 md:w-7 md:h-7 text-fortress-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-fortress-gold/50 text-[10px] md:text-xs tracking-[3px] md:tracking-[4px] uppercase font-semibold mb-1">
                  Sector {String(index + 1).padStart(2, "0")}
                </p>
                <h2
                  className={`text-xl md:text-4xl font-bold mb-1 break-words ${index % 2 === 1 ? "text-fortress-ivory" : "text-fortress-navy"}`}
                >
                  {sector.title}
                </h2>
                <p className="text-fortress-gold text-sm md:text-lg">
                  {sector.subtitle}
                </p>
              </div>
            </div>

            {/* Image + Content Grid */}
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-12 items-start">
              {/* Image */}
              <div
                className={`lg:col-span-2 ${index % 2 === 0 ? "lg:order-last" : ""}`}
              >
                <div
                  className={`relative aspect-[4/3] overflow-hidden border rounded-sm ${index % 2 === 1 ? "border-fortress-gold/10" : "border-fortress-gold/20"}`}
                >
                  <Image
                    src={sector.image}
                    alt={sector.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${index % 2 === 1 ? "from-fortress-deep/40" : "from-white/40"} to-transparent`}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                {sector.body.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className={`text-sm md:text-base leading-relaxed mb-4 md:mb-5 last:mb-0 ${index % 2 === 1 ? "text-fortress-silver" : "text-fortress-charcoal/70"}`}
                  >
                    {para}
                  </p>
                ))}

                {/* Investment areas list */}
                <div className="mt-6 md:mt-8">
                  <p className="text-fortress-gold text-[10px] md:text-xs tracking-[3px] md:tracking-[4px] uppercase font-semibold mb-3 md:mb-4">
                    {{
                      "Real Estate": "OUR REAL ESTATE INVESTMENT FOCUS",
                      "Business Acquisitions": "OUR BUSINESS ACQUISITION FOCUS",
                      "Private Equity": "OUR PRIVATE EQUITY INVESTMENT FOCUS",
                      "AI & Emerging Technology": "OUR AI & EMERGING TECHNOLOGY INVESTMENT FOCUS",
                      "Hospitality": "OUR HOSPITALITY INVESTMENT FOCUS",
                      "Digital Assets & Blockchain": "OUR DIGITAL ASSET INVESTMENT FOCUS",
                      "Energy & Physical Commodities": "OUR ENERGY & PHYSICAL COMMODITIES INVESTMENT FOCUS",
                      "Luxury Assets": "OUR LUXURY ASSET INVESTMENT FOCUS",
                      "Strategic Investment Management": "OUR STRATEGIC INVESTMENT MANAGEMENT FOCUS"
                    }[sector.title]}
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {sector.items.map((item, i) => (
                      <li key={i}>
                        {typeof item === "string" ? (
                          <span className={`text-xs md:text-sm leading-relaxed ${index % 2 === 1 ? "text-fortress-silver/80" : "text-fortress-charcoal/60"}`}>
                            {item}
                          </span>
                        ) : (
                          <div>
                            <p className={`text-sm md:text-base font-semibold ${index % 2 === 1 ? "text-fortress-ivory" : "text-fortress-navy"}`}>
                              {item.heading}
                            </p>
                            <p className={`text-xs md:text-sm leading-relaxed mt-0.5 ${index % 2 === 1 ? "text-fortress-silver/70" : "text-fortress-charcoal/60"}`}>
                              {item.desc}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Digital Assets evaluation criteria */}
                {sector.subheading && sector.subitems && (
                  <div
                    className={`mt-8 md:mt-10 p-5 md:p-8 border-l border-fortress-gold/25 rounded-sm ${index % 2 === 1 ? "bg-fortress-navy" : "bg-fortress-ivory/30"}`}
                  >
                    <p className="text-fortress-gold text-[10px] md:text-xs tracking-[3px] md:tracking-[4px] uppercase font-semibold mb-3 md:mb-4">
                      {sector.subheading}
                    </p>
                    <ul className="space-y-3">
                      {sector.subitems.map((item, i) => (
                        <li
                          key={i}
                          className={`text-xs md:text-sm leading-relaxed ${index % 2 === 1 ? "text-fortress-silver/80" : "text-fortress-charcoal/60"}`}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                    {sector.disclaimer && (
                      <p
                        className={`text-[10px] md:text-xs leading-relaxed mt-3 md:mt-4 ${index % 2 === 1 ? "text-fortress-silver/50" : "text-fortress-charcoal/40"}`}
                      >
                        {sector.disclaimer}
                      </p>
                    )}
                  </div>
                )}

                {/* Closing */}
                {sector.closing && (
                  <p
                    className={`text-sm md:text-base leading-relaxed mt-6 md:mt-8 border-t pt-4 md:pt-6 ${index % 2 === 1 ? "text-fortress-silver/70 border-fortress-gold/10" : "text-fortress-charcoal/60 border-fortress-gold/20"}`}
                  >
                    {sector.closing}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-12 md:py-28 bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">
            Investment Focus
          </p>
          <h2 className="text-xl md:text-4xl font-bold text-fortress-ivory mb-4 md:mb-6">
            Present an Opportunity to Fortress
          </h2>
          <p className="text-fortress-silver/80 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto mb-6 md:mb-8">
            We welcome selected proposals from business owners, founders,
            advisors, investors, developers, and strategic partners. Every
            submission is reviewed professionally and treated with discretion.
          </p>
          <Link
            href="/invest-with-fortress"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-sm tracking-widest hover:shadow-2xl hover:shadow-fortress-gold/25 transition-all duration-300"
          >
            SUBMIT AN INVESTMENT OPPORTUNITY
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

