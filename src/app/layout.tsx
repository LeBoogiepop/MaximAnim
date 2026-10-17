import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import Script from "next/script";
import { dockDiagnosticScript } from "@/lib/diagnostics/dock";
import { AppShell } from "@/components/layout/AppShell";
import { APP_DESCRIPTION, APP_NAME, THEME } from "@/config/app";
import { Providers } from "./providers";
import "./globals.css";

const archivo = localFont({ src: "./fonts/Archivo.ttf", variable: "--font-archivo", display: "swap", weight: "100 900", declarations: [{ prop: "font-stretch", value: "62% 125%" }] });

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    title: "MaximAnim Demo",
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
    <html lang="fr" className={archivo.variable}>
      <body>
        <Script id="dock-diagnostic" strategy="beforeInteractive">{dockDiagnosticScript(process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev")}</Script>
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          // Reloading on reconnect would interrupt a playing episode.
          reloadOnOnline={false}
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
