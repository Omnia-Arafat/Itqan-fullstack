import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { Link } from "@/i18n/navigation";
import { getAcademyBySlug } from "@/lib/academy-dal";

type AcademyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; academy: string }>;
};

export async function generateMetadata({
  params,
}: Omit<AcademyLayoutProps, "children">): Promise<Metadata> {
  const { locale, academy: academySlug } = await params;
  
  const academy = await getAcademyBySlug(academySlug);
  if (!academy) {
    return { title: "Academy Not Found" };
  }

  const academyName = locale === 'ar' ? academy.name_ar : academy.name_en;
  const description = locale === 'ar' 
    ? (academy.description_ar || academyName) 
    : (academy.description_en || academyName);

  return {
    title: { default: academyName, template: `%s · ${academyName}` },
    description: description,
    applicationName: academyName,
  };
}

export default async function AcademyLayout({
  children,
  params,
}: AcademyLayoutProps) {
  const { locale, academy: academySlug } = await params;
  setRequestLocale(locale);

  // Fetch academy details
  const academy = await getAcademyBySlug(academySlug);
  if (!academy) {
    notFound();
  }

  const academyName = locale === 'ar' ? academy.name_ar : academy.name_en;
  const academyTagline = locale === 'ar' 
    ? (academy.description_ar || '') 
    : (academy.description_en || '');

  return (
    <>
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href={`/${academySlug}`} className="flex items-center gap-3">
            {academy.logo_path ? (
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src={academy.logo_path}
                  alt={academyName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <BrandMark className="h-9 w-9 shrink-0" />
            )}
            <span className="flex flex-col leading-tight">
              <span 
                className="font-display text-lg font-bold dark:text-brand-300"
                style={{ color: academy.primary_color }}
              >
                {academyName}
              </span>
              {academyTagline && (
                <span className="text-xs text-muted-foreground">
                  {academyTagline}
                </span>
              )}
            </span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border-subtle bg-surface">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{academyName}</span>
            <Link 
              href="/" 
              className="hover:text-foreground transition-colors"
            >
              {locale === 'ar' ? 'تغيير الأكاديمية' : 'Switch Academy'}
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
