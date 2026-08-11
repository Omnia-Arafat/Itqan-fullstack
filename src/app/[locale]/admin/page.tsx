import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyLinkButton } from "@/components/copy-link-button";
import { DashboardHeader } from "@/components/dashboard-header";
import { Link } from "@/i18n/navigation";
import { requireAdminSession } from "@/lib/auth/dal";
import type { Circle, Teacher } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type AdminPageProps = { params: Promise<{ locale: string }> };

/** Authorized route: never prerender it. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: AdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title") };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const tCircle = await getTranslations("circle");
  const tDashboard = await getTranslations("dashboard");

  const session = await requireAdminSession("/admin");

  const supabase = await createClient();
  // `is_admin()` widens every one of these through RLS, so no extra filtering.
  const [circlesResult, teachersResult, studentCount] = await Promise.all([
    supabase.from("circles").select("*").order("start_time"),
    supabase.from("teachers").select("*").order("name"),
    supabase.from("students").select("*", { count: "exact", head: true }),
  ]);

  if (circlesResult.error) console.error("admin circles failed", circlesResult.error);
  if (teachersResult.error) console.error("admin teachers failed", teachersResult.error);
  if (studentCount.error) console.error("admin student count failed", studentCount.error);

  const circles: Circle[] = circlesResult.data ?? [];
  const teachers: Teacher[] = teachersResult.data ?? [];
  const teacherNames = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));

  const stats = [
    { label: t("stats.circles"), value: circles.filter((c) => c.is_active).length },
    { label: t("stats.teachers"), value: teachers.filter((teach) => teach.is_active).length },
    { label: t("stats.students"), value: studentCount.count ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reports" className="btn-primary w-full sm:w-auto">
            {t("openReports")}
          </Link>
          <Link href="/dashboard" className="btn-secondary w-full sm:w-auto">
            {t("myCircles")}
          </Link>
        </div>
      </section>

      <DashboardHeader teacher={session.teacher} />

      <section className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className="font-display text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("circles.title")}</h2>

        {circles.length === 0 ? (
          <div className="card">
            <p className="text-muted-foreground">{t("circles.empty")}</p>
            <Link href="/dashboard/new" className="btn-primary mt-3 w-full sm:w-auto">
              {tDashboard("newCircle")}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {circles.map((circle) => (
              <li key={circle.id} className="card flex flex-col gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {tCircle(`type.${circle.type}`)} ·{" "}
                    {tDashboard(`gender.${circle.gender_category}`)}
                    {!circle.is_active && ` · ${t("circles.inactive")}`}
                  </p>
                  <h3 className="truncate text-lg font-semibold">{circle.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("circles.teacherLabel", {
                      name: teacherNames.get(circle.teacher_id) ?? "—",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tCircle("startsAt", { time: circle.start_time.slice(0, 5) })}
                    {" · "}
                    <span dir="ltr">{circle.timezone}</span>
                    {" · "}
                    {circle.days_of_week
                      .slice()
                      .sort((a, b) => a - b)
                      .map((day) => tDashboard(`daysShort.${day}`))
                      .join(" ")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/circle/${circle.id}`}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    {tDashboard("manageSession")}
                  </Link>
                  <Link
                    href={`/admin/circle/${circle.id}/edit`}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Edit
                  </Link>
                  <CopyLinkButton path={`/circle/${circle.registration_slug}`} />
                  <Link
                    href={`/admin/reports?circle=${circle.id}`}
                    className="text-sm font-medium text-brand-600 dark:text-brand-300"
                  >
                    {t("circles.report")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("teachers.title")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("teachers.note")}</p>

        <ul className="flex flex-col gap-2">
          {teachers.map((teacher) => (
            <li
              key={teacher.id}
              className="card flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{teacher.name}</p>
                <p className="text-sm text-muted-foreground">
                  {tDashboard(`role.${teacher.role}`)} ·{" "}
                  {tDashboard(`gender.${teacher.gender_category}`)}
                </p>
              </div>
              <span
                className={teacher.is_active ? "badge-done" : "badge-waiting"}
              >
                {teacher.is_active ? t("teachers.active") : t("teachers.inactive")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
