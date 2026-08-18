import type { Metadata } from "next";
import { IBM_Plex_Sans, Manrope } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"]
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "VikleanPM",
  description: "Internal property management platform for staff workflows"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
