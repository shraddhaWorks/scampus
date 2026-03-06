import type { Metadata } from "next";
import "./globals.css";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sms",
  description: "Developed by shnakar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${inter.variable}
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
        `}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
