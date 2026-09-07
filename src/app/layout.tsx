import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Work_Sans } from "next/font/google";
import RouteTransition from "@/components/RouteTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Archivo({
  variable: "--font-display",
  weight: ["700", "800"],
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Fuel Log",
  description: "Track every plate, every day.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
