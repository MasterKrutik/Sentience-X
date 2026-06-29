import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

// Supported locales
export const locales = [
  "en", "en-US", "hi", "bn", "te", "mr", "ta", "gu", "ur", "kn",
  "or", "ml", "pa", "as", "mai", "sat", "ks", "kok", "sd", "dgo",
  "mni", "brx", "sa", "fr", "de", "es", "pt", "ja"
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// RTL locales
export const rtlLocales: Locale[] = ["ur", "ks", "sd"];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../messages/en.json`)).default;
  }

  return {
    locale,
    messages,
  };
});
