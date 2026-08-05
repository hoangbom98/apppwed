import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.07-.78 4.2-1.83 7-3.04 8.4-3.63 4-.17-.11-.23-.11-.23z" />
  </svg>
);

const IconMap: Record<string, any> = {
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram,
  x: XIcon,
  linkedin: Linkedin,
};

const Footer = () => {
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const { data } = await api.get("/api/public/channels");
        if (data && data.channels) {
          setChannels(data.channels);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };
    fetchChannels();
  }, []);

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.png" alt="OMNIS" className="h-12 w-auto" />
            </Link>
            <p className="text-primary-foreground/60 font-body text-sm leading-relaxed mb-6">
              Your trusted partner in Dubai&apos;s premium real estate market.
              Guided by a client-first philosophy, we connect investors and
              homebuyers with the right property opportunities through
              transparency, honesty, and integrity.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/Omnisprops/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/omnispropertiesdubai/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/OmnisProperties"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
              >
                <XIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/omnis-properties-ba3648323/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@OmnisProperties"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="font-display text-lg font-semibold text-gold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                {
                  label: "Off-Plan Properties",
                  path: "/properties?category=off-plan",
                },
                {
                  label: "Resale Properties",
                  path: "/properties?category=secondary",
                },
                { label: "Rentals", path: "/properties?category=rental" },
                { label: "About Us", path: "/about" },
                { label: "Our Services", path: "/services" },
                { label: "Blog", path: "/blog" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/60 hover:text-gold transition-colors text-sm font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h4 className="font-display text-lg font-semibold text-gold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-gold mt-1 shrink-0" />
                <span className="text-primary-foreground/80 text-sm font-body leading-relaxed">
                  Building R308
                  <br />
                  Office No. 301-21
                  <br />
                  Khalid Bin Al Waleed Road
                  <br />
                  Mankhool, Dubai, UAE
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-gold shrink-0 mt-1" />
                <div className="flex flex-col gap-4">
                  {[
                    { flag: "🇦🇪", num: "+971 58 825 1088", wa: "971588251088", tel: "+971588251088" },
                    { flag: "🇦🇪", num: "+971 58 153 0100", wa: "971581530100", tel: "+971581530100" },
                    { flag: "🇮🇳", num: "+91 76786 51405", wa: "917678651405", tel: "+917678651405" },
                  ].map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 group hover:border-gold/30 transition-all">
                      <div className="flex items-center gap-3 text-primary-foreground/90 font-body text-sm">
                        <span className="text-base shrink-0">{contact.flag}</span>
                        <span className="font-medium whitespace-nowrap tracking-wide">{contact.num}</span>
                      </div>
                      <div className="flex items-center gap-2.5 ml-1">
                        <a
                          href={`https://wa.me/${contact.wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-all shadow-sm"
                          title="WhatsApp Business"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </a>
                        {contact.tel && (
                          <a
                            href={`tel:${contact.tel}`}
                            className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-white hover:text-white transition-all"
                            title="Call Now"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gold shrink-0" />
                <a
                  href="mailto:info@omnisrealty.com"
                  className="text-primary-foreground/80 hover:text-gold text-sm font-body transition-colors"
                >
                  info@omnisrealty.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h4 className="font-display text-lg font-semibold text-gold mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-primary-foreground/60 hover:text-gold transition-colors text-sm font-body"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-conditions"
                  className="text-primary-foreground/60 hover:text-gold transition-colors text-sm font-body"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="font-display text-sm font-semibold text-gold mb-3">
                Join Our Channels
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://whatsapp.com/channel/0029VbBn9KR0LKZHcgEZ3D2d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
                  title="WhatsApp Channel"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://t.me/VikasOmnisPropertiesDubai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary-foreground/60 hover:bg-gold hover:text-primary transition-all duration-300"
                  title="Telegram Channel"
                >
                  <TelegramIcon className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-light/20 mt-12 pt-8 text-center">
          <p className="text-primary-foreground/40 text-sm font-body">
            © {new Date().getFullYear()} Omnis Properties LLC. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
