import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ujjwal Jain // CORTEX",
  description: "Engineering monitoring platform — live system health, architectural decisions, and deployment observability by Ujjwal Jain.",
  openGraph: {
    title: "Ujjwal Jain // CORTEX",
    description: "Engineering monitoring platform. Live health checks, architectural decisions, deployment pipelines, and system observability.",
    url: "https://ujjwaljain.dev",
    siteName: "CORTEX",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ujjwal Jain // CORTEX",
    description: "Engineering monitoring platform. Live health checks, architectural decisions, deployment pipelines, and system observability.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://ujjwaljain.dev"),
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
            __html: `(function(){try{var d=localStorage.getItem("pos-darkMode");if(d!==null&&!JSON.parse(d)){document.documentElement.classList.add("light")}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
