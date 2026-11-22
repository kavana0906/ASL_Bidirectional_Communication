import type { Metadata } from "next";
import "./globals.css";
import { TranslationProvider } from "@/context/TranslationContext";
import PageTransition from "@/components/ui/PageTransition";

export const metadata: Metadata = {
  title: "SignBridge AI",
  description: "Real-time communication between sign language and spoken language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>
  <TranslationProvider>
    <PageTransition>{children}</PageTransition>
  </TranslationProvider>
</body>
    </html>
  );
}
