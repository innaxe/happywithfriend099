import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const ibmThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "เป้าเงิน — ออมเงินให้ถึงเป้า",
  description:
    "แอปช่วยกลุ่มเพื่อนออมเงินให้ถึงเป้า บันทึกยอด แนบสลิป แจ้งเตือน Discord และซิงค์เรียลไทม์",
  applicationName: "เป้าเงิน",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f6f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${ibmThai.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
