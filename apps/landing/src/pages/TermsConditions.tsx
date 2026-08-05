import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import {
  FileText,
  Gavel,
  Scale,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Eye,
} from "lucide-react";

const TermsConditions = () => {
  const lastUpdated = "March 09, 2026";

  const sections = [
    {
      icon: Gavel,
      title: "General Information",
      content: `The information provided on the OMNIS Properties website is intended for general informational purposes regarding real estate opportunities in Dubai and the UAE.`,
    },
    {
      icon: AlertCircle,
      title: "Accuracy & Changes",
      content: `While we strive to ensure that property details, pricing, payment plans, and project information are accurate and up to date, these details may change without prior notice by developers or relevant authorities. OMNIS Properties does not guarantee the completeness or accuracy of all information displayed.`,
    },
    {
      icon: Eye,
      title: "Visual Disclaimer",
      content: `Images, renderings, and project visuals shown on the website are for illustrative purposes only and may not represent the final delivered product.`,
    },
    {
      icon: Scale,
      title: "Advisory Role",
      content: `OMNIS Properties acts as a real estate brokerage and advisory firm and does not provide legal, financial, or tax advice. Visitors are encouraged to conduct their own due diligence and seek professional advice before making investment decisions.`,
    },
    {
      icon: ShieldAlert,
      title: "Liability",
      content: `By using this website, you agree that OMNIS Properties shall not be held liable for any decisions or actions taken based on the information provided on this website.`,
    },
    {
      icon: HelpCircle,
      title: "Compliance",
      content: `Users are responsible for ensuring that any property transactions comply with applicable regulations and real estate laws within the United Arab Emirates.`,
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-20">
        <div className="h-64 md:h-80 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-gradient-hero opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center px-4"
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Terms & Conditions
              </h1>
              <p className="text-gold font-body text-sm tracking-[0.2em] uppercase">
                Last Updated: {lastUpdated}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="prose prose-lg max-w-none text-muted-foreground font-body"
            >
              <div className="grid gap-12">
                {sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                        <section.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                          {section.title}
                        </h2>
                        <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {section.content}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-20 p-8 rounded-2xl bg-card border border-border">
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  Legal Inquiries
                </h3>
                <p className="mb-4">
                  For any legal concerns or formal inquiries regarding these
                  terms, please contact our legal department at the following
                  address:
                </p>
                <div className="text-gold font-bold">
                  Email: info@omnisrealty.com
                  <br />
                  Office: Building R308, Office No. 301-21, Khalid Bin Al Waleed
                  Road, Mankhool, Dubai, UAE
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsConditions;
