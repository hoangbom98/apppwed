import type { Metadata } from "next";
import Script from "next/script";
import WhatsAppButton from "@/components/WhatsAppButton";
import CustomCursor from "@/components/CustomCursor";
import AnimationProvider from "@/components/AnimationProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fortress Investment Holdings | Investment Company in Dubai, UAE",
    template: "%s | Fortress Investment Holdings",
  },
  description:
    "Fortress Investment Holdings is a Dubai-based diversified investment holding company investing in real estate, business acquisitions, private equity, AI & technology, hospitality, and strategic partnerships across the UAE.",
  keywords: [
    "investment company Dubai",
    "private equity UAE",
    "real estate investment Dubai",
    "business acquisitions UAE",
    "Fortress Investment Holdings",
    "Dubai investments",
    "strategic partnerships",
    "AI technology investment",
    "hospitality investment Dubai",
    "luxury assets investment",
  ],
  authors: [{ name: "Fortress Investment Holdings" }],
  creator: "Fortress Investment Holdings",
  publisher: "Fortress Investment Holdings",
  metadataBase: new URL("https://fortressih.com"),
  openGraph: {
    title: "Fortress Investment Holdings",
    description: "Built on Strength. Driven by Vision.",
    type: "website",
    locale: "en_US",
    siteName: "Fortress Investment Holdings",
    url: "https://fortressih.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fortress Investment Holdings",
    description: "Built on Strength. Driven by Vision.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://fortressih.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
        {/* Meta Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'XXXXXXXXXXXXXXX');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body
        className="antialiased bg-fortress-navy text-fortress-silver cursor-none"
      >
        <AnimationProvider>
          <CustomCursor />
          {children}
          <WhatsAppButton />
        </AnimationProvider>
      </body>
    </html>
  );
}
