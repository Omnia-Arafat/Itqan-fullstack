import { redirect } from "next/navigation";
import { getAcademies } from "@/lib/academy-dal";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

// Old /login route — redirect to the first academy's login, or the selector
export default async function OldLoginPage() {
  const locale = await getLocale();
  const academies = await getAcademies();

  if (academies.length === 1) {
    redirect(`/${locale}/${academies[0].slug}/login`);
  }

  // Multiple academies — go to root selector
  redirect(`/${locale}`);
}
