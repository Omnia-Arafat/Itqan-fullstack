import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function OldCirclePage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();

  if (!isSupabaseConfigured()) notFound();

  // Look up the circle's academy slug so we can redirect to the right route
  const supabase = await createClient();
  const { data } = await supabase
    .rpc("circle_public_info", { p_slug: slug });

  const circle = data?.[0];
  if (!circle) notFound();

  // Get the academy slug
  const { data: academyData } = await supabase
    .from("academies")
    .select("slug")
    .eq("id", circle.academy_id)
    .single();

  if (academyData?.slug) {
    redirect(`/${locale}/${academyData.slug}/circle/${slug}`);
  }

  notFound();
}
