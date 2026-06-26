import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";
import { getThemeScript } from "@teispace/next-themes/server";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hans & Czay - Wedding RSVP",
  description: "The Royal Invitation of Hans and Czay. December 20, 2026.",
  icons: {
    icon: "/hansandczay.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeScript({ attribute: 'class', defaultTheme: 'system' })}
        </Script>
      </head>
      <body className="min-h-screen bg-wedding-softdark text-wedding-cream overflow-hidden selection:bg-wedding-cream/10 selection:text-wedding-cream font-inter" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          noScript
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
