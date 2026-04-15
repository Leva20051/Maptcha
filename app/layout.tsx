import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { getSessionUserById } from "@/lib/data";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Cafe Curator",
  description: "Discover cafes by atmosphere, WiFi, study fit, and trusted curator picks.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;

  return (
    <html lang="en">
      <body>
        <SiteHeader session={currentUser} />
        <main>{children}</main>
      </body>
    </html>
  );
}
