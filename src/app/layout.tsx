import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Olympian CRM",
  description: "Soma Cap Olympian Outreach CRM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <nav className="border-b bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold">🏅 Olympian CRM</h1>
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">People</a>
            <a href="/campaigns" className="text-sm text-gray-600 hover:text-gray-900">Campaigns</a>
          </div>
          <span className="text-xs text-gray-400">Soma Cap</span>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
