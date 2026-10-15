import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";
import { getThemeScript } from "@teispace/next-themes/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { fontVariables } from "./fonts";

// Event pages and the 404 set their own title, icon and link preview
// (src/app/[event]/page.tsx); this title is what the admin pages show.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Event Admin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontVariables} antialiased`}
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
      <body className="min-h-screen bg-surface-soft text-ink overflow-hidden selection:bg-ink/10 selection:text-ink font-body" suppressHydrationWarning>
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
