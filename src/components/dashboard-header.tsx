import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/[locale]/login/actions";
import { Link } from "@/i18n/navigation";
import type { Teacher } from "@/lib/database.types";

/**
 * Deliberately not part of the root layout: reading the session there would
 * make every public page dynamic and cost the home and registration pages their
 * static render. Students never sign in, so only teacher screens carry this.
 */
export async function DashboardHeader({ teacher }: { teacher: Teacher }) {
  const t = await getTranslations("dashboard");

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">{teacher.name}</p>
        <p className="text-sm text-muted-foreground">
          {t(`role.${teacher.role}`)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {teacher.role === "admin" && (
          <Link href="/admin" className="btn-secondary px-4 py-2 text-sm">
            {t("adminArea")}
          </Link>
        )}
        <form action={signOut}>
          <button type="submit" className="btn-secondary px-4 py-2 text-sm">
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
