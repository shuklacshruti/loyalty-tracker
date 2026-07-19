import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Punch In — Counter Loyalty",
  description: "Digital punch-card loyalty tracking for small stores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-mono text-ink bg-paper min-h-screen">{children}</body>
    </html>
  );
}
