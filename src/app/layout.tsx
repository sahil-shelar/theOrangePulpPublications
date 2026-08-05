import type { Metadata } from "next";
import { Inter, Jost } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import AutoAds from "@/components/ads/AutoAds";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const headingFont = Jost({
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Orange Pulp | Movie Reviews & Film Culture",
  description: "Premium movie reviews, news, spotlights and rankings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');if(s==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${headingFont.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ThemeProvider>
          <NextTopLoader
            color="#E2BFCA"
            shadow="0 0 10px #E2BFCA, 0 0 5px #E2BFCA"
            height={3}
            showSpinner={false}
            easing="ease"
            speed={200}
          />
          <AutoAds />
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
