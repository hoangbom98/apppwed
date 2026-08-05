import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import {
  Shield,
  Target,
  Award,
  TrendingUp,
  Linkedin,
  Instagram,
  Mail,
  ArrowRight,
  Diamond,
  Briefcase,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/about-dubai.jpg"
            alt="Dubai Luxury Real Estate"
            className="w-full h-full object-cover opacity-20 object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/90 to-primary" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 mb-8">
              <Diamond className="w-4 h-4 text-gold" />
              <span className="text-gold font-body text-xs uppercase tracking-[0.3em] font-bold">
                About Omnis Properties
              </span>
            </div>
            <h1 className="text-center font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight mb-8">
              EXCELLENCE IN <br className="hidden md:block" />
              <span className="text-white/90 font-body">
                DUBAI REAL ESTATE
              </span>
            </h1>
            <p className="text-white/60 font-body text-base lg:text-lg xl:text-xl leading-relaxed max-w-2xl mx-auto">
              A premier advisory firm dedicated to connecting discerning global
              investors with exceptional property opportunities across the UAE.
            </p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
        >
          <span className="text-gold/50 text-xs font-body tracking-[0.2em] uppercase">
            Discover
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/50 to-transparent" />
        </motion.div>
      </section>

      {/* Business Methodology - Editorial Layout */}
      <section className="py-24 lg:py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 xl:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 relative"
            >
              <div className="aspect-[4/5] overflow-hidden relative shadow-2xl">
                <img
                  src="/images/property-villa.jpg"
                  alt="Omnis properties methodology"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/5" />
              </div>
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 right-2 sm:-right-6 md:-right-10 md:-bottom-10 bg-primary text-white p-6 md:p-8 shadow-2xl border border-gold/20 max-w-[160px] md:max-w-[200px]">
                <div className="text-gold font-display text-4xl md:text-5xl font-bold mb-2">
                  10+
                </div>
                <div className="text-white/70 font-body text-[10px] md:text-sm uppercase tracking-widest font-bold">
                  Years of Excellence
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7 xl:pl-10"
            >
              <h2 className="text-left font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-8 leading-tight">
                A MODERN APPROACH <br />
                <span className="text-gold font-body">
                  TO DUBAI REAL ESTATE
                </span>
              </h2>
              <div className="space-y-6 text-muted-foreground font-body text-lg leading-relaxed">
                <p>
                  Our focus is on investors looking to benefit from Dubai’s
                  growing real estate market. We work with a carefully selected
                  portfolio of projects that offer strong potential for capital
                  appreciation and attractive rental returns, helping clients
                  secure investments with long-term value. From the first
                  conversation to project handover, we provide clear and honest
                  guidance at every stage of the process.
                </p>
                <p>
                  We offer end-to-end support including project selection,
                  booking assistance, documentation guidance, and post-handover
                  services. Whether clients choose to rent their property for
                  steady income or sell for future gains, our client-centric
                  approach ensures a dependable and transparent experience.
                  Integrity, transparency, and long-term relationships remain at
                  the core of how we support every property investment journey.
                </p>
              </div>
              <div className="mt-12">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/contact">
                    Speak with an Advisor{" "}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 lg:py-32 bg-primary relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="absolute -left-40 top-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute -right-40 bottom-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block text-gold font-body text-xs uppercase tracking-[0.4em] font-bold mb-4">
              Our Leader
            </span>
            <h2 className="text-center font-display text-4xl md:text-5xl font-bold text-white">
              THE VISIONARIES BEHIND{" "}
              <span className="font-body">OMNIS</span>
            </h2>
            <div className="w-16 h-[1px] bg-gold mx-auto mt-8" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {/* Team Members */}
            {[
              {
                name: "Vikas Kumar",
                role: "Founder & General Manager",
                brokerNo: "39159",
                image: "/images/Vikas-kumar.jpeg",
                bio: "Founder of OMNIS Properties, Vikas Kumar oversees the firm's strategic direction, client advisory, and investment consulting. He holds an MBA in Urban Infrastructure and Real Estate Management from Amity University, Noida (2012). With extensive experience in the Dubai and UAE real estate markets, he specializes in guiding investors toward well-researched, high-potential property opportunities through a transparent, client-first approach.",
                links: {
                  linkedin: "https://www.linkedin.com/in/vikas-kumar-23828224",
                  instagram: "https://www.instagram.com/astrorealtorvk/",
                  email: "mailto:vikas@omnisrealty.com",
                },
              },
              {
                name: "Jamal Alsuwaidi",
                role: "Local Partner",
                brokerNo: "39735",
                image: "/images/Jamal.jpeg",
                bio: "Jamal Alsuwaidi is a Local Partner at OMNIS Properties and holds a position within the Dubai Government. He has been associated with the company since its establishment and supports the firm in government-related matters, while also strengthening its presence both locally and internationally.",
                links: {
                  linkedin: "https://www.linkedin.com/in/omnisprop",
                  instagram: "https://www.instagram.com/omnispropertiesdubai/",
                  email: "mailto:info@omnisrealty.com",
                },
              },
              {
                name: "Anstin Machado",
                role: "OPERATIONS & DIGITAL MARKETING MANAGER",
                image: "/images/Anstin.jpeg",
                bio: "Anstin Machado oversees administrative operations and digital marketing initiatives at Omnis Properties, ensuring smooth coordination of documentation processes while guiding the company's digital branding and creative direction.",
                links: {
                  linkedin: "https://www.linkedin.com/in/anstin01/",
                  instagram: "https://www.instagram.com/realtor_ixe_dxb/",
                  email: "mailto:Anstin@omnisrealty.com",
                },
              },
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group"
              >
                <div className="relative overflow-hidden aspect-[3/4] mb-8">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-top filter grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out scale-100 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent opacity-80" />

                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-1 uppercase">
                          {member.name}
                        </h3>
                        <p className="text-gold font-body text-xs uppercase tracking-[0.2em] font-bold">
                          {member.role}
                        </p>
                        {"brokerNo" in member && member.brokerNo && (
                          <p className="text-white/60 font-body text-[9px] uppercase tracking-[0.1em] mt-1.5 border-t border-white/10 pt-1.5 w-fit">
                            BRN: {member.brokerNo as string}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <a
                          href={member.links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/40 hover:text-gold transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                        <a
                          href={member.links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/40 hover:text-gold transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                        <a
                          href={member.links.email}
                          className="text-white/40 hover:text-gold transition-colors"
                        >
                          <Mail className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-white/60 font-body text-base leading-relaxed text-justify">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Values */}
      <section className="py-24 lg:py-32 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block text-gold font-body text-xs uppercase tracking-[0.4em] font-bold mb-4">
              Core Principles
            </span>
            <h2 className="text-center font-display text-4xl md:text-5xl font-bold text-primary">
              THE OMNIS ADVANTAGE
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[
              {
                icon: Shield,
                title: "Absolute Integrity",
                desc: "We operate with total transparency, ensuring every recommendation is rooted in honest, data-driven analysis.",
              },
              {
                icon: Briefcase,
                title: "Client-Centric",
                desc: "Your investment objectives dictate our strategy. We structure deals designed specifically to meet your unique goals.",
              },
              {
                icon: Target,
                title: "Market Precision",
                desc: "Utilizing advanced market intelligence to identify high-yield opportunities before they become mainstream.",
              },
              {
                icon: Award,
                title: "Unrivaled Excellence",
                desc: "From the initial consultation to post-handover management, we demand the highest standard of service.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-14 h-14 bg-primary text-gold rounded-none flex items-center justify-center mb-8">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary mb-4 uppercase">
                  {item.title}
                </h3>
                <p className="text-muted-foreground font-body leading-relaxed text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Elevated CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-center font-display text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              UNLOCK OPPORTUNITIES IN
              <br />
              <span className="text-gold font-body">
                DUBAI REAL ESTATE.
              </span>
            </h2>
            <p className="text-white/70 font-body text-lg md:text-xl mb-12">
              Our team helps investors identify properties with strong potential
              for growth, rental income, and long-term value.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full px-4 sm:px-0">
              <Button
                variant="hero"
                size="xl"
                asChild
                className="w-full sm:w-auto min-w-[200px]"
              >
                <Link to="/properties">View Portfolio</Link>
              </Button>
              <Button
                variant="hero-outline"
                size="xl"
                className="w-full sm:w-auto min-w-[200px]"
                asChild
              >
                <Link to="/contact">Private Consultation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
