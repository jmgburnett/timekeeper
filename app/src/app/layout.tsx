import type { Metadata } from "next";
import "./globals.css";
import { ConvexProvider } from "./convex-provider";
import { AuthGate } from "./components/auth-gate";

export const metadata: Metadata = {
  title: "Timekeeper",
  description: "Lightweight team timekeeping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ConvexProvider>
          <AuthGate>{children}</AuthGate>
        </ConvexProvider>
      </body>
    </html>
  );
}
