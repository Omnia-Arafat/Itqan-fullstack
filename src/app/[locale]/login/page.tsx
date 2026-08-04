import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SetupNotice } from "@/components/setup-notice";
import { redirect } from "@/i18n/navigation";
import { getTeacherSession, isActiveTeacher } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LoginPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title") };
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { next } = await searchParams;
  const t = await getTranslations("auth");

  // Nothing to do here for someone who can already work.
  const session = await getTeacherSession();
  if (isActiveTeacher(session)) {
    redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <section>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </section>

      {!isSupabaseConfigured() && <SetupNotice />}

      <LoginForm next={next ?? null} />

      <p className="text-center text-sm text-muted-foreground">
        {t("studentsNote")}
      </p>
    </div>
  );
}
