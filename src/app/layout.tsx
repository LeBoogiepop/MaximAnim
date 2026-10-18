import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import Script from "next/script";
import { dockDiagnosticScript } from "@/lib/diagnostics/dock";
import { AppShell } from "@/components/layout/AppShell";
import { APP_DESCRIPTION, APP_NAME, SITE_URL, THEME } from "@/config/app";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/language";
import { Providers } from "./providers";
import "./globals.css";

const archivo = localFont({ src: "./fonts/Archivo.ttf", variable: "--font-archivo", display: "swap", weight: "100 900", declarations: [{ prop: "font-stretch", value: "62% 125%" }] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    locale: "en_GB",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MaximAnim on three phone screens: home, an anime page and the watch screen" }],
  },
  twitter: { card: "summary_large_image", title: APP_NAME, description: APP_DESCRIPTION, images: ["/og.png"] },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    // Content runs under the status bar; safe-area insets keep it readable.
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
  // Next emits only the standard `mobile-web-app-capable`; older iOS still keys
  // standalone launch and the translucent status bar off the Apple-prefixed tag.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME.ink,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LANGUAGE} className={archivo.variable}>
      <body>
        <Script id="dock-diagnostic" strategy="beforeInteractive">{dockDiagnosticScript(process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev")}</Script>
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          // Reloading on reconnect would interrupt a playing episode.
          reloadOnOnline={false}
          // Its history.pushState/replaceState patch posts the target to the worker as-is, and Next passes URL objects, which
          // cannot be cloned: once the worker controls the page, in-app navigation and Back end on the error screen.
          cacheOnNavigation={false}
          options={{ scope: "/", type: "classic" }}
        >
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}
