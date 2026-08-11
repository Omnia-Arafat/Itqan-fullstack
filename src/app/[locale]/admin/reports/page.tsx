import { redirect } from "next/navigation";
import { getTeacherSession, isActiveTeacher } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function OldAdminReportsPage() {
  const locale = await getLocale();
  const session = await getTeacherSession();

  if (isActiveTeacher(session)) {
    const supabase = await createClient();
    const { data: teacher } = await supabase
      .from("teachers")
      .select("academy_id, academies:academy_id(slug)")
      .eq("id", session.teacher.id)
      .single();

    const academySlug = (teacher?.academies as any)?.slug;
    if (academySlug) {
      redirect(`/${locale}/${academySlug}/admin/reports`);
    }
  }

  redirect(`/${locale}/login`);
}
