import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { Link } from "@/i18n/navigation";

type HomeProps = { params: Promise<{ locale: string }> };

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center text-center">
        <BrandMark className="h-20 w-20" />
        <h1 className="font-display mt-4 text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </section>

      <section className="card border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-surface">
        <h2 className="text-xl font-semibold">{t("newStudent.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("newStudent.body")}</p>
        <Link href="/register" className="btn-primary mt-4 w-full sm:w-auto">
          {t("newStudent.cta")}
        </Link>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">{t("returningStudent.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("returningStudent.body")}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("returningStudent.note")}
        </p>
      </section>

      <section className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">{t("teacher.title")}</h2>
        <Link href="/login" className="btn-secondary w-full sm:w-auto">
          {t("teacher.cta")}
        </Link>
      </section>
    </div>
  );
}
