import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyLinkButton } from "@/components/copy-link-button";
import { DashboardHeader } from "@/components/dashboard-header";
import { TeacherAccountNotice } from "@/components/teacher-account-notice";
import { Link } from "@/i18n/navigation";
import { isActiveTeacher, requireTeacherSession } from "@/lib/auth/dal";
import type { Circle } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = { params: Promise<{ locale: string }> };

/**
 * The locale layout's `generateStaticParams` makes every child a prerender
 * candidate, and this page only reads cookies once Supabase credentials exist —
 * so without this it would be statically baked at build time, session and all.
 * An authorized route must never be prerendered.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const tCircle = await getTranslations("circle");

  const session = await requireTeacherSession("/dashboard");

  if (!isActiveTeacher(session)) {
    return (
      <TeacherAccountNotice
        reason={session.teacher ? "inactive" : "notLinked"}
        email={session.email}
      />
    );
  }

  const supabase = await createClient();
  const [todayResult, allResult] = await Promise.all([
    // Already filtered to circles that meet today in the circle's own timezone.
    supabase.rpc("teacher_today_circles"),
    // RLS narrows this to the teacher's own circles (all circles for an admin).
    supabase.from("circles").select("*").eq("is_active", true).order("start_time"),
  ]);

  if (todayResult.error) console.error("teacher_today_circles failed", todayResult.error);
  if (allResult.error) console.error("circles select failed", allResult.error);

  const todayCircles = todayResult.data ?? [];
  const todayIds = new Set(todayCircles.map((circle) => circle.id));
  const otherCircles: Circle[] = (allResult.data ?? []).filter(
    (circle) => !todayIds.has(circle.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/dashboard/new" className="btn-primary w-full sm:w-auto">
          {t("newCircle")}
        </Link>
      </section>

      <DashboardHeader teacher={session.teacher} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("today.title")}</h2>

        {todayCircles.length === 0 ? (
          <p className="card text-muted-foreground">{t("today.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {todayCircles.map((circle) => (
              <li key={circle.id} className="card flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {tCircle(`type.${circle.type}`)} ·{" "}
                      {t(`gender.${circle.gender_category}`)}
                    </p>
                    <h3 className="truncate text-lg font-semibold">
                      {circle.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tCircle("startsAt", { time: circle.start_time.slice(0, 5) })}
                    </p>
                  </div>
                  <span className="badge-done shrink-0">
                    {t("joinedCount", { count: String(circle.joined_count) })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/circle/${circle.id}`}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {t("manageSession")}
                  </Link>
                  <CopyLinkButton path={`/circle/${circle.registration_slug}`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("other.title")}</h2>

        {otherCircles.length === 0 ? (
          <p className="card text-muted-foreground">{t("other.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {otherCircles.map((circle) => (
              <li
                key={circle.id}
                className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {tCircle(`type.${circle.type}`)} ·{" "}
                    {t(`gender.${circle.gender_category}`)}
                  </p>
                  <h3 className="truncate font-semibold">{circle.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tCircle("startsAt", { time: circle.start_time.slice(0, 5) })}
                    {" · "}
                    {circle.days_of_week
                      .slice()
                      .sort((a, b) => a - b)
                      .map((day) => t(`daysShort.${day}`))
                      .join(" ")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/circle/${circle.id}`}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {t("openCircle")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
