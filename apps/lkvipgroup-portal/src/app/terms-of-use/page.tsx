import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for the Fortress Investment Holdings website. Please read these terms carefully before using our website.",
};

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-white pt-24 md:pt-32 pb-12 md:pb-20 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <p className="text-fortress-gold text-xs md:text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">
            Legal
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-fortress-navy mb-4">
            Website Terms of Use
          </h1>
          <p className="text-fortress-charcoal/70 text-sm">
            Last Updated: [INSERT DATE]
          </p>
        </div>
      </section>

      <section className="bg-white my-8 md:my-12 sm:mx-4 rounded-2xl py-12 md:py-20 px-6 lg:px-20">
        <div className="max-w-[860px] mx-auto">
          <div className="space-y-10 text-fortress-charcoal/70 leading-relaxed text-sm sm:text-base">
            <p>
              By accessing or using the Fortress Investment Holdings website, you agree to these Terms of Use. If you do not agree, please discontinue use of the website.
            </p>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Website Purpose</h2>
              <p>
                This website provides general information about Fortress Investment Holdings, its activities, investment interests, partnerships, and related content.
              </p>
              <p className="mt-4">
                The website does not constitute an offer, recommendation, solicitation, or invitation to buy, sell, subscribe to, or invest in any security, financial product, business, asset, digital asset, or investment opportunity.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Information Accuracy</h2>
              <p>
                We aim to provide accurate and current information but do not guarantee that all content is complete, accurate, current, or free from error. Content may be updated, changed, or removed without notice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">No Professional Advice</h2>
              <p>
                Website content is provided for general information only and should not be treated as financial, investment, legal, tax, accounting, regulatory, or valuation advice.
              </p>
              <p className="mt-4">
                Please obtain independent professional advice before making any investment, acquisition, legal, financial, or commercial decision.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Opportunity Submissions</h2>
              <p>
                Submitting an opportunity through this website does not guarantee review or acceptance, and does not create an investment commitment, partnership, advisory relationship, confidential relationship, agency relationship, or contractual obligation.
              </p>
              <p className="mt-4">
                Fortress Investment Holdings may accept, reject, or decline to respond to any submission at its sole discretion.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Intellectual Property</h2>
              <p>
                Unless otherwise stated, all website content, branding, logos, designs, text, graphics, and materials are owned by or licensed to Fortress Investment Holdings. Content may not be copied, modified, reproduced, distributed, republished, or used commercially without written permission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Third-Party Links</h2>
              <p>
                The website may include links to third-party websites. Fortress Investment Holdings is not responsible for their content, privacy practices, availability, or accuracy. Accessing third-party websites is at your own risk.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Fortress Investment Holdings shall not be responsible for losses, damages, costs, or liabilities arising from use of the website, reliance on its content, interruptions, technical errors, security incidents outside our reasonable control, third-party links, or investment or business decisions made by users.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Governing Law</h2>
              <p>
                These Terms of Use are governed by the applicable laws of the United Arab Emirates and the relevant laws and regulations of the Emirate in which Fortress Investment Holdings is registered.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Contact</h2>
              <p>Questions regarding these terms:</p>
              <div className="mt-3 space-y-1">
                <p>Email: [INSERT LEGAL EMAIL]</p>
                <p>Address: [INSERT OFFICE ADDRESS]</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
