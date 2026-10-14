import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AudioPlayer } from "@/components/AudioPlayer";
import Script from "next/script";
import { getThemeScript } from "@teispace/next-themes/server";
import { SiteTextProvider } from "@/contexts/SiteTextContext";
import { getSiteContent, formatEventDate } from "@/lib/siteContentServer";
import { fillText } from "@/lib/siteText";

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
  const { global, siteText } = await getSiteContent();
  const values = { couple: global.coupleNameFormat, date: formatEventDate(global.targetDate), venue: global.venueShort };
  const title = fillText(siteText.seo.title, values);
  const description = fillText(siteText.seo.description, values);
  const ogImage = global.ogImage;

  return {
    title,
    description,
    icons: {
      icon: global.logo,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteText } = await getSiteContent();

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
        {/* `t-mouse` on <html> gates every hover style and the ring cursor
            (globals.css, WeddingCursor.tsx). Some Chrome installs report
            `hover: none` with a real mouse, so a mouse move also sets it and a
            touch clears it. */}
        <Script id="pointer-init" strategy="beforeInteractive">
          {`(function(){var r=document.documentElement,c='t-mouse';
function set(on){if(r.classList.contains(c)!==on)r.classList.toggle(c,on)}
if(matchMedia('(hover: hover) and (pointer: fine)').matches)set(true);
function on(e){if(e.pointerType==='mouse')set(true);else if(e.pointerType==='touch')set(false)}
addEventListener('pointermove',on,{passive:true,capture:true});
addEventListener('pointerdown',on,{passive:true,capture:true})})()`}
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
          <SiteTextProvider value={siteText}>
            {children}
            <AudioPlayer />
          </SiteTextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
