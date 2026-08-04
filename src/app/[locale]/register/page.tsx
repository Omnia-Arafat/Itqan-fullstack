import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { RegisterForm } from "./register-form";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ circle?: string }>;
};

export async function generateMetadata({
  params,
}: Pick<RegisterPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "register" });
  return { title: t("title") };
}

export default async function RegisterPage({
  params,
  searchParams,
}: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { circle } = await searchParams;
  const t = await getTranslations("register");

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </section>

      {!isSupabaseConfigured() && <SetupNotice />}

      <RegisterForm circleSlug={circle ?? null} />
    </div>
  );
}
