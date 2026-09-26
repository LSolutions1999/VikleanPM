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
  title: "VikleanWork | Property Manager",
  description: "VikleanWork property management workspace",
  icons: {
    icon: "/vikleanworklogored.png",
    shortcut: "/vikleanworklogored.png",
    apple: "/vikleanworklogored.png"
  }
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
