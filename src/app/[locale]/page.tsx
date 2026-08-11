import { setRequestLocale } from "next-intl/server";
import { getAcademies } from "@/lib/academy-dal";
import { AcademySelector } from "@/components/academy-selector";
import { redirect } from "next/navigation";

type HomeProps = { params: Promise<{ locale: string }> };

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const academies = await getAcademies();

  // If there's only one academy, redirect directly to it
  if (academies.length === 1) {
    redirect(`/${academies[0].slug}`);
  }

  // Show academy selector if multiple academies exist
  return <AcademySelector academies={academies} locale={locale} />;
}
