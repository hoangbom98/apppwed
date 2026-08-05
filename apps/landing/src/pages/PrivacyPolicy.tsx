import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, Scale, Globe } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "March 09, 2026";

  const sections = [
    {
      icon: Eye,
      title: "Introduction",
      content: `At OMNIS Properties, we respect your privacy and are committed to protecting the personal information you share with us through our website.`,
    },
    {
      icon: Lock,
      title: "Data Collection",
      content: `When you submit information through contact forms, enquiry forms, or KYC submissions, we may collect personal details such as your name, email address, phone number, and other relevant information.`,
    },
    {
      icon: FileText,
      title: "Information Usage",
      content: `This information is used solely for responding to enquiries, providing real estate advisory services, and improving our client support.`,
    },
    {
      icon: Globe,
      title: "Data Sharing",
      content: `We do not sell, trade, or share your personal information with third parties except where necessary to facilitate property-related services or where required by applicable laws and regulatory authorities in the UAE.`,
    },
    {
      icon: Shield,
      title: "Cookies & Tracking",
      content: `This website may use cookies and similar technologies to enhance user experience and analyze website performance. Cookies help us understand how visitors interact with our website so we can improve functionality and content. Users may disable cookies through their browser settings; however, certain website features may be affected.`,
    },
    {
      icon: Scale,
      title: "Confidentiality",
      content: `All personal information provided through this website is handled with confidentiality and used only for legitimate business purposes related to OMNIS Properties’ services.`,
    },
    {
      icon: FileText,
      title: "Consent",
      content: `By using this website and submitting your information, you consent to the collection and use of your data in accordance with this policy.`,
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
                Privacy Policy
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
                  Contact Our Privacy Officer
                </h3>
                <p className="mb-4">
                  If you have any questions or concerns about this policy or our
                  data practices, please do not hesitate to reach out to our
                  dedicated privacy team.
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

export default PrivacyPolicy;
