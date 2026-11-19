import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CPDL Sundry Billing Portal",
    template: "%s · CPDL Sundry Portal",
  },
  description:
    "Tariff-wise sundry bill estimation and charged-entry reconciliation for Chandigarh Power Distribution Limited.",
  applicationName: "CPDL Sundry Billing Portal",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#edf0ea",
};

const themeInit = `(function(){try{var k="cpdl-theme";var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:"light";document.documentElement.dataset.theme=t;document.addEventListener("DOMContentLoaded",function(){var c=t==="dark"?"#0e1310":"#edf0ea";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=c;});});}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${archivo.variable} ${plexMono.variable}`}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="site-main">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
