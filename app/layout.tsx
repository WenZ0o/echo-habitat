import type { Metadata } from "next";
import "./globals.css";
import "./world.css";
import "./living-archipelago.css";
import "./district-architecture.css";
import "./photoreal-districts.css";

export const metadata: Metadata = {
  title: "ECHO HABITAT — A small world, unfolding",
  description: "Observe three digital residents, shape their environment, and follow the memories and relationships they create. An interactive life simulation.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
