import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AudioPlayer } from "@/components/AudioPlayer";
import Script from "next/script";
import { getThemeScript } from "@teispace/next-themes/server";
import { getAdminDb } from "@/lib/firebase/admin";
import weddingContent from "@/data/wedding-content.json";

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

export async function generateMetadata(): Promise<Metadata> {
  let ogImage = weddingContent.global.ogImage;
  const title = "Hans & Czay - Wedding RSVP";
  const description = "The Royal Invitation of Hans and Czay. December 20, 2026.";

  try {
    const db = getAdminDb();
    const docSnap = await db.collection('websiteContent').doc('globalSettings').get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.ogImage) {
        ogImage = data.ogImage;
      }
    }
  } catch (error) {
    console.error("Error fetching metadata from Firebase:", error);
  }

  return {
    title,
    description,
    icons: {
      icon: "/hansandczay.svg",
    },
    openGraph: {
      title,
      description,
      url: "https://hans-czay-wedding.vercel.app/",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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
          <AudioPlayer />
        </ThemeProvider>
      </body>
    </html>
  );
}
