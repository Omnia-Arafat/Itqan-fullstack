import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireTeacherSession, isActiveTeacher } from "@/lib/auth/dal";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAcademyBySlug } from "@/lib/academy-dal";
import { notFound, redirect } from "next/navigation";
import { CopyLinkButton } from "@/components/copy-link-button";

type CirclesManagePageProps = {
  params: Promise<{ locale: string; academy: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Manage Circles" };
}

export default async function CirclesManagePage({ params }: CirclesManagePageProps) {
  const { locale, academy: academySlug } = await params;
  setRequestLocale(locale);

  const academy = await getAcademyBySlug(academySlug);
  if (!academy) {
    notFound();
  }

  const t = await getTranslations("admin");
  const tCircle = await getTranslations("circle");
  const tDashboard = await getTranslations("dashboard");

  const session = await requireTeacherSession(`/${academySlug}/admin/circles`);

  if (!isActiveTeacher(session) || session.teacher.role !== "admin") {
    redirect(`/${academySlug}/dashboard`);
  }

  const supabase = await createClient();

  const [circlesResult, teachersResult] = await Promise.all([
    supabase
      .from("circles")
      .select("*")
      .eq("academy_id", academy.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("teachers")
      .select("id, name")
      .eq("academy_id", academy.id),
  ]);

  const circles = circlesResult.data ?? [];
  const teachers = teachersResult.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Manage Circles
          </h1>
          <p className="mt-2 text-muted-foreground">
            All circles in this academy
          </p>
        </div>
        <Link
          href={`/${academySlug}/admin`}
          className="btn-secondary"
        >
          {t("back")}
        </Link>
      </section>

      <section>
        {circles.length === 0 ? (
          <p className="card text-muted-foreground">{t("circles.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {circles.map((circle) => {
              const teacher = teachers.find((t) => t.id === circle.teacher_id);
              return (
                <li
                  key={circle.id}
                  className={`card ${
                    !circle.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {tCircle(`type.${circle.type}`)} ·{" "}
                            {tDashboard(`gender.${circle.gender_category}`)}
                          </p>
                          {!circle.is_active && (
                            <span className="badge-absent text-xs">
                              {t("circles.inactive")}
                            </span>
                          )}
                        </div>
                        <h3 className="truncate text-lg font-semibold mt-1">
                          {circle.name}
                        </h3>
                        {teacher && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {t("circles.teacherLabel", { name: teacher.name })}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {tCircle("startsAt", {
                            time: circle.start_time.slice(0, 5),
                          })}{" "}
                          ·{" "}
                          {circle.days_of_week
                            .slice()
                            .sort((a, b) => a - b)
                            .map((day) => tDashboard(`daysShort.${day}`))
                            .join(" ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${academySlug}/admin/circles/${circle.id}`}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Edit Circle
                      </Link>
                      <Link
                        href={`/${academySlug}/dashboard/circle/${circle.id}`}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        Manage Session
                      </Link>
                      <CopyLinkButton
                        path={`/${academySlug}/circle/${circle.registration_slug}`}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
