import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StudioProvider } from "@/context/StudioContext";
import { AppHeader } from "@/components/layout/AppHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "PromptForge Studio — Production-Grade Prompt Engineering Suite",
  description:
    "Developer-first prompt management, dynamic parameter testing, and regression evaluation studio powered by Next.js and embedded SQLite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        <StudioProvider>
          <AppHeader />
          <main className="flex-1">{children}</main>
        </StudioProvider>
      </body>
    </html>
  );
}
