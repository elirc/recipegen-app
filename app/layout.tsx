import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "weeknight — quick dinner recipes",
  description: "Tell it what you have. Get dinner ideas in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FFFBF5] min-h-screen">
        <Nav />
        <main className="max-w-lg mx-auto px-4 pb-24 md:pb-8 pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
