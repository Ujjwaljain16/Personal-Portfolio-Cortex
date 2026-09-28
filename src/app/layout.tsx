import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { LayoutShell } from "@/components/layout/LayoutShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ujjwal Jain | Backend & systems engineer",
    template: "%s | Ujjwal Jain",
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    title: "Ujjwal Jain | Backend & systems engineer",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ujjwal Jain | Backend & systems engineer",
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;try{var d=localStorage.getItem("pos-darkMode");if(d!==null&&!JSON.parse(d)){r.classList.add("light")}}catch(e){}try{if(localStorage.getItem("pos-booted-v3")||window.matchMedia("(prefers-reduced-motion: reduce)").matches){r.dataset.boot="skip"}}catch(e){}})();`,
          }}
        />
        <noscript>
          <style>{`.boot-overlay{display:none}`}</style>
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
