import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Amiri, Cairo } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { Link } from "@/i18n/navigation";
import { localeDirection, routing, type Locale } from "@/i18n/routing";
import { ConditionalLayout } from "@/components/conditional-layout";
import "../globals.css";

// Cairo carries both Arabic and Latin, so the two locales stay visually
// consistent across the whole interface.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

// Amiri is a classical Naskh, used only for display headings and the wordmark.
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#08130f" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });

  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("description"),
    applicationName: t("name"),
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: t("name"),
      description: t("description"),
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering of localized routes.
  setRequestLocale(locale);

  const t = await getTranslations("app");

  return (
    <html
      lang={locale}
      dir={localeDirection[locale as Locale]}
      className={`${cairo.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <ConditionalLayout
            header={
              <header className="border-b border-border-subtle bg-surface">
                <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
                  <Link href="/" className="flex items-center gap-3">
                    <BrandMark className="h-9 w-9 shrink-0" />
                    <span className="flex flex-col leading-tight">
                      <span className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">
                        {t("name")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("tagline")}
                      </span>
                    </span>
                  </Link>
                  <LanguageToggle />
                </div>
              </header>
            }
            footer={
              <footer className="border-t border-border-subtle bg-surface">
                <div className="mx-auto w-full max-w-4xl px-4 py-4 text-center text-xs text-muted-foreground">
                  {t("name")}
                </div>
              </footer>
            }
          >
            {children}
          </ConditionalLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
