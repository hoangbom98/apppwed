import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Contact Us | Fortress Investment Holdings",
  description:
    "Contact Fortress Investment Holdings in Dubai, UAE. Get in touch by phone, email, or visit our office. We respond to all enquiries within 1-2 business days.",
  openGraph: {
    title: "Contact Us | Fortress Investment Holdings",
    description: "Get in touch with Fortress Investment Holdings in Dubai.",
  },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  let whatsapp = "971500000000";
  let phoneVal = "+971 4 XXX XXXX";
  let emailVal = "info@fortressih.com";
  let addressVal = "Dubai, United Arab Emirates";
  try {
    const settings = await getSettings();
    if (settings) {
      whatsapp = settings.whatsapp || whatsapp;
      phoneVal = settings.phone || phoneVal;
      emailVal = settings.email || emailVal;
      addressVal = settings.address || addressVal;
    }
  } catch {
    // Use defaults
  }

  const contactInfo = [
    {
      icon: Phone,
      label: "Telephone",
      value: phoneVal,
      href: `tel:${phoneVal.replace(/\s/g, "")}`,
    },
    {
      icon: Mail,
      label: "Email",
      value: emailVal,
      href: `mailto:${emailVal}`,
    },
    {
      icon: MapPin,
      label: "Office",
      value: addressVal,
      href: "#map",
    },
    {
      icon: Clock,
      label: "Hours",
      value: "Sun - Thu, 9AM - 6PM GST",
      href: "#",
    },
  ];
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Banner */}
      <section className="bg-white pt-24 md:pt-32 pb-12 md:pb-20 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <p className="text-fortress-gold text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">
            Contact Us
          </p>
          <h1 className="text-3xl md:text-6xl font-bold text-fortress-navy">
            Let&apos;s Start a Conversation
          </h1>
          <p className="text-fortress-navy/60 text-lg leading-relaxed max-w-2xl mx-auto mt-6">
            Whether you have a question, an investment opportunity, or simply
            want to learn more about Fortress - we are here to help.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="bg-fortress-navy my-8 md:my-12 sm:mx-4 rounded-2xl py-12 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <h2 className="text-center text-fortress-ivory text-2xl md:text-3xl font-bold mb-12">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {contactInfo.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-4 p-5 bg-fortress-charcoal/40 rounded-2xl hover:bg-fortress-charcoal/60 transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-fortress-gold/10 flex items-center justify-center flex-shrink-0 rounded-xl">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-fortress-gold" />
                </div>
                <div>
                  <p className="text-fortress-silver text-xs">{item.label}</p>
                  <p className="text-fortress-ivory font-medium text-sm">
                    {item.value}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="my-8 md:my-12 sm:mx-4">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-10">
              <h2 className="text-2xl font-bold text-fortress-navy mb-2">
                Send Us a Message
              </h2>
              <p className="text-fortress-navy/60 text-sm mb-8">
                We typically respond within 1-2 business days.
              </p>
              <ContactForm />

              <div className="mt-10 pt-8 border-t border-fortress-navy/10">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white hover:bg-green-600 transition-all duration-300 text-sm font-medium rounded-xl"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Map */}
            <div
              className="lg:col-span-3 bg-fortress-charcoal rounded-2xl overflow-hidden h-full min-h-[500px]"
              id="map"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.643879742878!2d55.2708!3d25.1972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5d348d56a8df%3A0x2e84e1b4b4b4b4b4!2sDubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sae!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "grayscale(0.6) contrast(1.1)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Fortress Investment Holdings Office Location"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
