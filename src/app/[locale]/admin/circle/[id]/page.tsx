import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { requireAdminSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditCircleForm } from "./edit-form";

type AdminCirclePageProps = { params: Promise<{ locale: string; id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: AdminCirclePageProps): Promise<Metadata> {
  await params;
  return { title: "Edit circle" };
}

export default async function AdminCirclePage({ params }: AdminCirclePageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await requireAdminSession(`/admin/circle/${id}/edit`);

  const supabase = await createClient();
  const { data: circle, error } = await supabase.from("circles").select("*").eq("id", id).maybeSingle();

  if (error) console.error("admin circle load failed", error);
  if (!circle) notFound();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Edit circle</h1>
          <p className="mt-2 text-muted-foreground">
            Update the circle settings or deactivate it.
          </p>
        </div>
      </section>

      <DashboardHeader teacher={session.teacher} />

      <EditCircleForm circle={circle} locale={locale} />
    </div>
  );
}
