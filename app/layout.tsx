import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalyst-MSIL Food Ordering",
  description: "Submit and review food orders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
