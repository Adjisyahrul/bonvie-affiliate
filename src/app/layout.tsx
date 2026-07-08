import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import LandingWrapper from "@/components/LandingWrapper";
import ClientShell from "@/components/ClientShell";
import FloatingCat from "@/components/FloatingCat";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Bonvie Affiliate Co-Pilot 🌸",
  description: "Internal affiliate management dashboard — made with love 💕",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="flex min-h-screen" suppressHydrationWarning>
        <ClientShell>
          <LandingWrapper />
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen p-8">
            {children}
          </main>
          <FloatingCat />
          <SpeedInsights />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#fff",
                color: "#FF69B4",
                border: "2px solid #FFB6C1",
                borderRadius: "1rem",
                fontFamily: "Poppins, sans-serif",
                fontSize: "14px",
                padding: "12px 20px",
                boxShadow: "0 8px 30px rgba(255,105,180,0.2)",
              },
              success: { iconTheme: { primary: "#FF69B4", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#FF1493", secondary: "#fff" } },
            }}
          />
        </ClientShell>
      </body>
    </html>
  );
}
