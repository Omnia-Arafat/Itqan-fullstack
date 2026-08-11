import { redirect } from "next/navigation";
import { getTeacherSession, isActiveTeacher } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OldAdminCirclePage({ params }: Props) {
  const { id } = await params;
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
      redirect(`/${locale}/${academySlug}/admin/circles/${id}/edit`);
    }
  }

  redirect(`/${locale}/login`);
}
