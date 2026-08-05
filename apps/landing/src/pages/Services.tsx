import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import {
  Building2,
  Key,
  Umbrella,
  TrendingUp,
  ShieldCheck,
  Globe2,
  Home,
  Briefcase,
  Map,
  Landmark,
  FileText,
  CheckCircle2,
  CarFront,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    icon: TrendingUp,
    title: "Property Investment Advisory",
    desc: "We help investors identify the right opportunities in Dubai’s real estate market based on their investment goals and budget. Our team provides market insights, project comparisons, and guidance on high-potential developments. The aim is to help clients make informed and strategic property decisions.",
  },
  {
    icon: Building2,
    title: "Off-Plan Property Sales",
    desc: "We provide access to new developments from leading developers across Dubai and other emirates. Clients receive guidance on project selection, payment plans, and booking procedures. Off-plan investments often offer flexible payment structures and strong long-term appreciation potential.",
  },
  {
    icon: Home,
    title: "Secondary Market (Resale) Properties",
    desc: "For buyers looking for ready properties, we assist in sourcing apartments, villas, and townhouses in established communities. Our team helps with property evaluation, negotiation, and transaction support. This option is ideal for investors seeking immediate rental income or end users looking for ready homes.",
  },
  {
    icon: Key,
    title: "Property Leasing",
    desc: "We help tenants find suitable rental properties and support landlords in leasing their units. Our services include tenant sourcing, property marketing, and lease coordination. The goal is to make the rental process smooth and efficient for both parties.",
  },
  {
    icon: ShieldCheck,
    title: "UAE Golden Visa Assistance",
    desc: "We guide investors and professionals through the process of obtaining the UAE Golden Visa. This long-term residency option provides stability for investors, entrepreneurs, and skilled professionals. Our team assists with eligibility assessment and documentation.",
  },
  {
    icon: Briefcase,
    title: "RAKEZ Business Registration",
    desc: "We assist clients in setting up companies through Ras Al Khaimah Economic Zone (RAKEZ). RAKEZ offers flexible business setup options with competitive licensing costs. Our service includes registration guidance, documentation support, and process coordination.",
  },
  {
    icon: Globe2,
    title: "Meydan Free Zone Company Setup",
    desc: "Meydan Free Zone provides a modern and efficient environment for entrepreneurs and international businesses. We help clients with company formation, licensing procedures, and compliance requirements. This allows businesses to establish a presence in the UAE smoothly.",
  },
  {
    icon: Map,
    title: "Real Estate Opportunities in Ras Al Khaimah",
    desc: "Ras Al Khaimah is emerging as one of the fastest-growing real estate markets in the UAE. We help investors explore residential and hospitality developments with strong growth potential. Our team provides guidance on projects suited for both investment and lifestyle.",
  },
  {
    icon: Landmark,
    title: "Real Estate Opportunities in Abu Dhabi",
    desc: "Abu Dhabi offers a stable and premium real estate market with strong long-term demand. We assist clients in identifying investment opportunities across residential and mixed-use developments. Our advisory focuses on projects with strong fundamentals and location advantages.",
  },
  {
    icon: FileText,
    title: "OCI (Overseas Citizen of India) Assistance",
    desc: "We provide guidance for individuals applying for Overseas Citizen of India (OCI) status. OCI allows eligible individuals of Indian origin to live and work in India with long-term privileges. Our team assists with documentation guidance and application procedures.",
  },
  {
    icon: CarFront,
    title: "Luxury Car Rental",
    desc: "Experience premium and luxury car rentals across Dubai and the UAE. From business travel to special occasions, we help arrange the right vehicle with a smooth booking experience. Use code OMNIS2026 to get 20% off your first rental.",
  },
  {
    icon: Handshake,
    title: "Business Sales & Acquisition Advisory",
    desc: "We help clients sell existing businesses or acquire established businesses across the UAE. From identifying opportunities to coordinating buyers, sellers, and negotiations, our team supports clients throughout the process with a clear and professional approach.",
  },
];

const Services = () => {
  return (
    <Layout>
      {/* Editorial Hero */}
      <section className="relative min-h-[70vh] flex items-center pt-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img
            src="/images/services-hero.png"
            alt="Dubai Skyline"
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px w-12 bg-gold" />
                <span className="text-gold font-body text-xs tracking-[0.5em] uppercase font-bold">
                  OMNIS Institutional Services
                </span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-medium text-white mb-10 leading-[1.1] tracking-tight">
                Refining the <br />
                <span className="text-gold">Standard</span> of Trust.
              </h1>
              <p className="text-white/60 font-body text-xl md:text-2xl max-w-2xl leading-relaxed font-light">
                A bespoke collective of real estate solutions designed for the
                world's most discerning investors and landlords in the United
                Arab Emirates.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-center gap-4">
          <span className="text-white/30 text-[10px] uppercase tracking-[0.3em] vertical-rl">
            Scroll to Explore
          </span>
          <div className="w-px h-16 bg-white/10 relative overflow-hidden">
            <motion.div
              animate={{ y: [0, 64] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 left-0 w-full h-1/2 bg-gold"
            />
          </div>
        </div>
      </section>

      {/* Services Section - High-End Editorial List */}
      <section className="py-32 bg-[#F9F8F6] relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 xl:gap-20">
            {/* Sticky Header Column */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-40">
                <h2 className="font-display text-4xl md:text-5xl font-medium text-primary mb-8 leading-tight">
                  Our Core <br />
                  Capabilities
                </h2>
                <div className="h-1 w-20 bg-gold mb-8" />
                <p className="text-primary/60 font-body text-lg leading-relaxed mb-12">
                  We combine local market intelligence with global standards of
                  excellence to deliver measurable results for our clients.
                </p>
                <Button
                  variant="gold"
                  size="lg"
                  className="rounded-none px-10 h-14 uppercase tracking-[0.2em] text-[10px] font-bold"
                  asChild
                >
                  <Link to="/contact">Request Prospectus</Link>
                </Button>
              </div>
            </div>

            {/* Services List Column */}
            <div className="lg:col-span-8 space-y-32">
              {services.map((service, i) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="group"
                >
                  <div className="flex flex-col md:flex-row gap-10 md:items-start group">
                    <div className="shrink-0 pt-2">
                      <span className="font-display text-4xl text-gold/30 group-hover:text-gold transition-colors duration-500">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex-1 pb-16 border-b border-primary/10">
                      <div className="flex items-center gap-4 mb-6">
                        <service.icon className="w-5 h-5 text-primary/40 group-hover:text-gold transition-colors duration-500" />
                        <h3 className="font-display text-3xl font-medium text-primary tracking-tight">
                          {service.title}
                        </h3>
                      </div>

                      <p className="text-primary/60 font-body text-lg leading-relaxed max-w-2xl mb-10">
                        {service.desc}
                      </p>

                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-4 text-primary font-body text-xs uppercase tracking-[0.3em] font-bold group/link"
                      >
                        <span>Detailed Inquiry</span>
                        <div className="w-8 h-px bg-primary/20 group-hover/link:w-16 transition-all duration-500" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Philosophy Section */}
      <section className="py-40 bg-white overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="aspect-[3/4] overflow-hidden relative">
                <img
                  src="/images/services-inner.png"
                  alt="Office Interior"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-primary p-12 text-white hidden xl:block shadow-2xl">
                <p className="font-display text-5xl font-medium mb-4 text-gold">
                  10+
                </p>
                <p className="font-body text-[10px] uppercase tracking-[0.4em] text-white/40">
                  Years of Market <br /> Leadership
                </p>
              </div>
            </motion.div>

            <div className="space-y-16">
              <div>
                <h2 className="font-display text-5xl font-medium text-primary mb-10 leading-tight">
                  Built on Transparency <br /> & Measured by Success
                </h2>
                <p className="text-primary/70 font-body text-xl leading-relaxed font-light">
                  We believe that professional real estate services extend
                  beyond a simple transaction. It is a relationship of
                  accountability, data-driven strategy, and absolute
                  transparency.
                </p>
              </div>

              <div className="grid gap-10">
                {[
                  {
                    t: "Strategic Advisory",
                    d: "High-level market analysis and portfolio optimization.",
                  },
                  {
                    t: "Global Network",
                    d: "Access to private investor circles and international capital.",
                  },
                  {
                    t: "RERA Compliance",
                    d: "Strict adherence to every regulatory standard in the UAE.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-8 group">
                    <div className="w-px h-12 bg-gold/30 group-hover:bg-gold transition-colors duration-500" />
                    <div>
                      <h4 className="font-display text-xl font-medium text-primary mb-2 tracking-tight">
                        {item.t}
                      </h4>
                      <p className="text-primary/50 text-sm font-body">
                        {item.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalism Final CTA */}
      <section className="py-40 bg-primary text-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="font-body text-4xl md:text-6xl lg:text-7xl font-medium text-white mb-12 leading-tight">
              Integrity is the <br />
              Only Luxury.
            </h2>
            <p className="text-white/40 font-body text-lg mb-16 tracking-wide uppercase text-[10px] font-bold">
              Schedule Your Private Consultation
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Button
                variant="gold"
                size="xl"
                className="rounded-none px-16 h-16 uppercase tracking-[0.3em] text-[10px] font-bold"
                asChild
              >
                <Link to="/contact">Secure Inquiry</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
