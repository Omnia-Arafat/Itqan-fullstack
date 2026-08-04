"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  initialRegisterState,
  registerStudent,
  type RegisterState,
} from "./actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function RegisterForm({ circleSlug }: { circleSlug: string | null }) {
  const t = useTranslations("register");
  const [state, formAction] = useActionState<RegisterState, FormData>(
    registerStudent,
    initialRegisterState,
  );

  if (state.status === "success") {
    return (
      <div className="card border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-surface">
        <h2 className="text-xl font-semibold">{t("success.title")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("success.body", { name: state.name })}
        </p>
        {state.circleSlug ? (
          <Link
            href={`/circle/${state.circleSlug}`}
            className="btn-primary mt-4 w-full sm:w-auto"
          >
            {t("success.backToCircle")}
          </Link>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("success.nextStep")}
          </p>
        )}
      </div>
    );
  }

  const values = state.status === "idle" ? null : state.values;
  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};
  const isDuplicate = state.status === "duplicate";

  return (
    <form action={formAction} className="card flex flex-col gap-4" noValidate>
      {circleSlug && (
        <input type="hidden" name="circleSlug" value={circleSlug} />
      )}

      <div>
        <label className="field-label" htmlFor="name">
          {t("fields.name")}
        </label>
        <input
          id="name"
          name="name"
          className="input"
          defaultValue={values?.name}
          autoComplete="off"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className="mt-1.5 text-sm text-absent">
            {t(`errors.${fieldErrors.name}`)}
          </p>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor="fatherName">
          {t("fields.fatherName")}
        </label>
        <input
          id="fatherName"
          name="fatherName"
          className="input"
          defaultValue={values?.fatherName}
          autoComplete="off"
          aria-invalid={Boolean(fieldErrors.fatherName)}
          aria-describedby="fatherName-hint"
        />
        <p id="fatherName-hint" className="mt-1.5 text-sm text-muted-foreground">
          {t("fields.fatherNameHint")}
        </p>
        {fieldErrors.fatherName && (
          <p className="mt-1.5 text-sm text-absent">
            {t(`errors.${fieldErrors.fatherName}`)}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="field-label">{t("fields.gender")}</legend>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((option) => (
            <label
              key={option}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2
                         rounded-xl border border-border-subtle bg-surface px-4 py-3
                         text-base font-medium has-checked:border-brand-600
                         has-checked:bg-brand-50 has-checked:text-brand-800
                         dark:has-checked:bg-brand-900 dark:has-checked:text-brand-100"
            >
              <input
                type="radio"
                name="gender"
                value={option}
                defaultChecked={values?.gender === option}
                className="accent-brand-600"
              />
              {t(`fields.${option}`)}
            </label>
          ))}
        </div>
        {fieldErrors.gender && (
          <p className="mt-1.5 text-sm text-absent">
            {t(`errors.${fieldErrors.gender}`)}
          </p>
        )}
      </fieldset>

      <div>
        <label className="field-label" htmlFor="phone">
          {t("fields.phone")}{" "}
          <span className="font-normal text-muted-foreground">
            ({t("fields.optional")})
          </span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          className="input text-start"
          defaultValue={values?.phone}
          autoComplete="tel"
        />
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("fields.phoneHint")}
        </p>
      </div>

      {isDuplicate && (
        <div className="rounded-xl border border-accent-300 bg-accent-100 p-4 text-accent-700">
          <p className="font-semibold">{t("duplicate.title")}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
            {state.matches.map((match) => (
              <li key={match.id}>
                {match.name} — {match.father_name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">{t("duplicate.body")}</p>
        </div>
      )}

      {state.status === "failed" && (
        <p className="text-sm text-absent">
          {t(`errors.${state.reason}`)}
        </p>
      )}

      {isDuplicate ? (
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            name="confirmDuplicate"
            value="1"
            className="btn-secondary w-full"
          >
            {t("duplicate.confirm")}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {t("duplicate.hint")}
          </p>
        </div>
      ) : (
        <SubmitButton label={t("submit")} pendingLabel={t("submitting")} />
      )}
    </form>
  );
}
