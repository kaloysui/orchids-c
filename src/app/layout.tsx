import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingProvider } from "@/hooks/useGlobalLoading";
import { GlobalLoadingIndicator } from "@/components/GlobalLoadingIndicator";
import NextTopLoader from "nextjs-toploader";
import AdScript from "@/components/AdScript";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { EmbedGuard } from "@/components/EmbedGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "bCine",
  description: "Watch the latest trending movies and TV shows on bCine.",
};

import { MusicGlobal } from "@/components/music/MusicGlobal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    return (
  <html lang="en">

    {/* ADMAVEN INTERSTITIAL */}
    <Script
      src="//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1254999"
      strategy="afterInteractive"
      data-cfasync="false"
    />

    <body className={`antialiased ${inter.variable} ${poppins.variable}`}>
        <ErrorReporter />
    

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "theme-amoled", "theme-red", "theme-teal", "theme-orange", "theme-violet", "theme-brown"]}
        >
          <LoadingProvider>
            <GlobalLoadingIndicator />
            <MusicGlobal>
              <div className="flex flex-col min-h-screen">
                <NextTopLoader
                  color="hsl(var(--primary))"
                  initialPosition={0.08}
                  crawlSpeed={200}
                  height={3}
                  crawl={true}
                  showSpinner={false}
                  easing="ease"
                  speed={200}
                  shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
                />
                {/* Google Analytics */}
                <Script
                  src="https://www.googletagmanager.com/gtag/js?id=G-FR2L0BGSNX"
                  strategy="afterInteractive"
                />

                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-FR2L0BGSNX');
                  `}
                </Script>
                <AdScript />
                <ErrorReporter />
                <EmbedGuard><Navbar /></EmbedGuard>

                <Toaster position="top-center" richColors />
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <EmbedGuard>
                  <footer className="py-10 mt-auto">
                    <div className="container mx-auto px-4 text-center">
                      <p className="text-sm text-muted-foreground/50 font-light">
                        All content is provided by external third-party services.
                      </p>
                    </div>
                  </footer>
                </EmbedGuard>
              </div>
            </MusicGlobal>
          </LoadingProvider>
        </ThemeProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
