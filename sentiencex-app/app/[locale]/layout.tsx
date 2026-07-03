import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, rtlLocales, type Locale } from "@/i18n/request";
import Providers from "@/components/layout/Providers";
import "@/app/globals.css";
import { Syne, DM_Sans, JetBrains_Mono, DM_Mono } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-data",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "SentienceX — AI Mental Health Platform",
    template: "%s | SentienceX",
  },
  description: "India's AI-powered passive mental health detection platform. Monitor 13 behavioral biomarkers, build your Mental Health Twin, and deploy your Recovery Engine.",
  keywords: ["mental health", "AI", "biomarkers", "India", "DPDP", "HIPAA", "mental twin"],
  authors: [{ name: "SentienceX AI" }],
  openGraph: {
    title: "SentienceX — AI Mental Health Platform",
    description: "The intelligence that feels what others cannot.",
    type: "website",
  },
  robots: { index: false, follow: false }, // Private health app
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="oklch(8% 0.01 270)" />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
