import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investment Disclaimer",
  description:
    "Investment Disclaimer and Risk Disclosure for Fortress Investment Holdings. Important information about investment risks and regulatory status.",
};

export default function InvestmentDisclaimerPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-white pt-24 md:pt-32 pb-12 md:pb-20 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <p className="text-fortress-gold text-xs md:text-sm font-medium tracking-[2px] md:tracking-[4px] uppercase mb-4">
            Legal
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-fortress-navy mb-4">
            Investment Disclaimer
          </h1>
          <p className="text-fortress-charcoal/70 text-sm">Risk Disclosure</p>
        </div>
      </section>

      <section className="bg-white my-8 md:my-12 sm:mx-4 rounded-2xl py-12 md:py-20 px-6 lg:px-20">
        <div className="max-w-[860px] mx-auto">
          <div className="space-y-10 text-fortress-charcoal/70 leading-relaxed text-sm sm:text-base">

            <p>
              The information on this website is provided for general informational purposes only.
            </p>
            <p>
              Nothing on this website constitutes investment advice, financial advice, legal advice, tax advice, a recommendation, an offer, a solicitation, a guarantee of returns, or an invitation to participate in an investment.
            </p>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Investment Risk</h2>
              <p>
                All investments involve risk. The value of investments  including businesses, real estate, private companies, digital assets, and luxury assets  may increase or decrease. Investors may lose part or all of the capital invested.
              </p>
              <p className="mt-4">
                Past performance is not a guarantee or reliable indicator of future results.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Private and Illiquid Investments</h2>
              <p>
                Private equity, business acquisitions, joint ventures, real estate, and other private investments may be illiquid. Investors may be unable to sell or exit within their preferred timeframe.
              </p>
              <p className="mt-4">
                Such investments may involve long holding periods, limited information, and operational, market, regulatory, financial, and management risk.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Digital Asset Risk</h2>
              <p>
                Digital asset-related investments may involve significant volatility, regulatory uncertainty, cybersecurity risk, technology risk, liquidity risk, custody risk, and the possibility of complete loss.
              </p>
              <p className="mt-4">
                References to blockchain or digital assets on this website should not be interpreted as a recommendation to purchase, sell, or hold any digital asset.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Independent Advice</h2>
              <p>
                Any person considering an investment, acquisition, partnership, or transaction should conduct independent due diligence and obtain advice from qualified financial, legal, tax, accounting, and regulatory professionals.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">No Guarantee</h2>
              <p>
                Fortress Investment Holdings does not guarantee investment returns, capital protection, income, profitability, business performance, asset appreciation, successful completion of any transaction, or availability of an exit.
              </p>
              <p className="mt-4">
                Any forecasts, projections, targets, or expectations are subject to uncertainty and may not be achieved.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fortress-navy mb-4">Regulatory Status</h2>
              <p>
                The inclusion of investment-related information on this website does not imply that Fortress Investment Holdings provides regulated financial services unless such services are specifically authorised by the relevant regulatory authority.
              </p>
              <p className="mt-4 text-fortress-charcoal/50 text-xs">
                The final legal wording should accurately reflect the company&apos;s incorporation, licensing, activities, and regulatory permissions, and be reviewed by qualified UAE legal counsel.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
