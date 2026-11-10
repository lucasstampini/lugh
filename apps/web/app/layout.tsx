import type { Metadata } from "next";
import { Funnel_Display, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const display = Funnel_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Lugh",
  description: "Mock interviews ao vivo com quem já está lá dentro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
