import { redirect } from "next/navigation";
import { getAcademies } from "@/lib/academy-dal";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type OldRegisterPageProps = {
  searchParams: Promise<{ circle?: string }>;
};

// Old /register route — redirect to the circle's academy when possible
export default async function OldRegisterPage({
  searchParams,
}: OldRegisterPageProps) {
  const { circle } = await searchParams;
  const locale = await getLocale();

  if (circle && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("circle_public_info", { p_slug: circle });
    const circleInfo = data?.[0];

    if (circleInfo?.academy_id) {
      const { data: academyData } = await supabase
        .from("academies")
        .select("slug")
        .eq("id", circleInfo.academy_id)
        .single();

      if (academyData?.slug) {
        redirect(`/${locale}/${academyData.slug}/register?circle=${circle}`);
      }
    }
  }

  const academies = await getAcademies();

  if (academies.length === 1) {
    const query = circle ? `?circle=${circle}` : "";
    redirect(`/${locale}/${academies[0].slug}/register${query}`);
  }

  redirect(`/${locale}`);
}
