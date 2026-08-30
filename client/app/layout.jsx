import { Archivo_Black, Inter, Noto_Sans_Gujarati } from "next/font/google";

import { appConfig } from "@/config/app.config";
import "./globals.css";

// Renders Gujarati script. Latin UI uses Canva Sans. Font order in
// --font-sans/--font-heading decides which face wins for a given glyph.
const notoSansGujarati = Noto_Sans_Gujarati({
  variable: "--font-gujarati",
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Count number on the launch screen (mockup: Archivo Black).
const archivoBlack = Archivo_Black({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const description =
  "ગુજરાતી ભાષામાં સરકારી પરીક્ષાલક્ષી પ્રશ્નોત્તરી, AI સમજૂતી અને પરિણામ વિશ્લેષણ સાથે.";

// Served from public/q3quiz.png — the social-share preview image for links
// to this app (WhatsApp/Facebook/Twitter link previews, etc.).
const shareImage = {
  url: "/q3quiz.png",
  width: 1672,
  height: 941,
  alt: appConfig.name,
};

export const metadata = {
  title: `${appConfig.name} - Q3Q`,
  description,
  openGraph: {
    title: appConfig.name,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description,
    images: [shareImage],
  },
};

export const viewport = {
  themeColor: "#2C6698",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="gu"
      className={`${notoSansGujarati.variable} ${archivoBlack.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
