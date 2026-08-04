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

      {/*
        Two doors, deliberately side by side. The two audiences are entirely
        separate: students never authenticate, teachers always do.
      */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card flex flex-col border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-surface">
          <span className="badge-done self-start">{t("doors.students.tag")}</span>
          <h2 className="mt-3 text-xl font-semibold">{t("doors.students.title")}</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            {t("doors.students.body")}
          </p>
          <Link href="/register" className="btn-primary mt-4 w-full">
            {t("doors.students.cta")}
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("doors.students.note")}
          </p>
        </div>

        <div className="card flex flex-col">
          <span className="badge-waiting self-start">{t("doors.teachers.tag")}</span>
          <h2 className="mt-3 text-xl font-semibold">{t("doors.teachers.title")}</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            {t("doors.teachers.body")}
          </p>
          <Link href="/login" className="btn-secondary mt-4 w-full">
            {t("doors.teachers.cta")}
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("doors.teachers.note")}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="text-base font-semibold">{t("returningStudent.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("returningStudent.body")}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("returningStudent.note")}
        </p>
      </section>
    </div>
  );
}
