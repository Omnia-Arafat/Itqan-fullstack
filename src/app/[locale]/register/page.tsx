import { redirect } from "next/navigation";
import { getAcademies } from "@/lib/academy-dal";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

// Old /register route — redirect to the first academy's register, or the selector
export default async function OldRegisterPage() {
  const locale = await getLocale();
  const academies = await getAcademies();

  if (academies.length === 1) {
    redirect(`/${locale}/${academies[0].slug}/register`);
  }

  redirect(`/${locale}`);
}
