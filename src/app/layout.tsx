import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "Materna AI — Explainable AI for Maternal Health Monitoring", template: "%s · Materna AI" },
  description: "From first trimester to delivery — monitoring, care coordination, emergency access, and everyday wellbeing in one platform. Prototype MVP.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#177d7b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
