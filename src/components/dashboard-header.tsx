import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/[locale]/[academy]/login/actions";
import { Link } from "@/i18n/navigation";
import type { Teacher } from "@/lib/database.types";

export async function DashboardHeader({
  teacher,
  academySlug,
}: {
  teacher: Teacher;
  academySlug?: string;
}) {
  const t = await getTranslations("dashboard");

  const signOutWithAcademy = signOut.bind(null, academySlug ?? "");

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">{teacher.name}</p>
        <p className="text-sm text-muted-foreground">
          {t(`role.${teacher.role}`)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {teacher.role === "admin" && academySlug && (
          <Link
            href={`/${academySlug}/admin`}
            className="btn-secondary px-4 py-2 text-sm"
          >
            {t("adminArea")}
          </Link>
        )}
        <form action={signOutWithAcademy}>
          <button type="submit" className="btn-secondary px-4 py-2 text-sm">
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
