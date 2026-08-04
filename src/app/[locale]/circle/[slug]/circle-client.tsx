"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { QueueEntry, StudentSearchResult } from "@/lib/database.types";
import {
  getJoined,
  joinedKey,
  setJoined,
  subscribeJoined,
} from "@/lib/joined-store";
import { createClient } from "@/lib/supabase/client";

type CircleClientProps = {
  slug: string;
  circleId: string;
  sessionDate: string;
  initialQueue: QueueEntry[];
};

/** Results are tagged with the query they answer, which makes stale responses
 *  impossible to display and removes the need for a separate loading flag. */
type SearchResults = { query: string; items: StudentSearchResult[] };

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

export function CircleClient({
  slug,
  circleId,
  sessionDate,
  initialQueue,
}: CircleClientProps) {
  const t = useTranslations("circle");
  const supabase = useMemo(() => createClient(), []);
  const storageKey = joinedKey(slug, sessionDate);

  const [queue, setQueue] = useState<QueueEntry[]>(initialQueue);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joined = useSyncExternalStore(
    subscribeJoined,
    () => getJoined(storageKey),
    () => null,
  );

  const refreshQueue = useCallback(async () => {
    const { data, error: queueError } = await supabase.rpc("circle_queue", {
      p_slug: slug,
    });
    if (!queueError && data) setQueue(data);
  }, [supabase, slug]);

  // Realtime carries no student names, so each event is only a signal to
  // refetch circle_queue().
  useEffect(() => {
    const channel = supabase
      .channel(`circle:${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
          filter: `circle_id=eq.${circleId}`,
        },
        () => {
          void refreshQueue();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, circleId, refreshQueue]);

  // Debounced autocomplete. Everything happens inside the timeout callback so
  // no state is set synchronously while the effect runs.
  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error: searchError } = await supabase.rpc("search_students", {
        p_slug: slug,
        p_query: trimmed,
      });
      if (cancelled) return;
      if (searchError) {
        setError("generic");
        return;
      }
      setResults({ query: trimmed, items: data ?? [] });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, supabase, slug]);

  const matches = results?.query === trimmed ? results.items : null;
  const searching = trimmed.length >= MIN_QUERY && matches === null;

  async function join(student: StudentSearchResult) {
    setJoining(student.id);
    setError(null);

    const { data, error: joinError } = await supabase.rpc("join_circle", {
      p_slug: slug,
      p_student_id: student.id,
    });

    setJoining(null);

    if (joinError) {
      // The gender guard is enforced in the database, not just in the query.
      setError(
        joinError.message.includes("gender_mismatch")
          ? "genderMismatch"
          : "generic",
      );
      return;
    }

    if (!data?.[0]) {
      setError("generic");
      return;
    }

    setJoined(storageKey, { studentId: student.id, name: student.name });
    setQuery("");
    setResults(null);
    await refreshQueue();
  }

  const myPosition = joined
    ? queue.find((entry) => entry.student_id === joined.studentId)?.queue_order
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      {joined && myPosition !== undefined ? (
        <section className="card border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-surface">
          <h2 className="text-lg font-semibold">
            {t("joined.title", { name: joined.name })}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {t("joined.position", { position: String(myPosition) })}
          </p>
        </section>
      ) : (
        <section className="card">
          <label className="field-label" htmlFor="student-search">
            {t("search.label")}
          </label>
          <input
            id="student-search"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={Boolean(matches)}
            aria-controls="student-results"
          />
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("search.hint")}
          </p>

          {searching && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("search.searching")}
            </p>
          )}

          {matches && matches.length > 0 && (
            <ul id="student-results" className="mt-3 flex flex-col gap-2">
              {matches.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => join(student)}
                    disabled={joining !== null}
                    className="flex w-full items-center justify-between gap-3 rounded-xl
                               border border-border-subtle bg-surface px-4 py-3 text-start
                               transition-colors hover:bg-surface-muted disabled:opacity-50"
                  >
                    <span>
                      <span className="block font-semibold">{student.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {t("search.fatherLabel", { name: student.father_name })}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                      {joining === student.id
                        ? t("search.joining")
                        : t("search.join")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {matches && matches.length === 0 && (
            <div className="mt-3 rounded-xl border border-border-subtle bg-surface-muted p-4">
              <p className="font-semibold">{t("notFound.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("notFound.body")}
              </p>
              <Link
                href={`/register?circle=${slug}`}
                className="btn-primary mt-3 w-full sm:w-auto"
              >
                {t("notFound.cta")}
              </Link>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-absent">{t(`errors.${error}`)}</p>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {t("queue.title", { count: String(queue.length) })}
        </h2>

        {queue.length === 0 ? (
          <p className="card text-muted-foreground">{t("queue.empty")}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {queue.map((entry) => {
              const isMe = joined?.studentId === entry.student_id;
              return (
                <li
                  key={entry.attendance_id}
                  className={`card flex items-center gap-3 py-3 ${
                    isMe ? "border-brand-400 bg-brand-50 dark:bg-brand-950" : ""
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                               bg-surface-muted text-sm font-bold"
                  >
                    {entry.queue_order}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {entry.name}
                      {isMe && (
                        <span className="ms-2 text-sm font-normal text-brand-600 dark:text-brand-300">
                          {t("queue.you")}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {entry.father_name}
                    </span>
                  </span>
                  <span className={badgeClass(entry.recitation_status)}>
                    {t(`status.${entry.recitation_status}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function badgeClass(status: QueueEntry["recitation_status"]) {
  if (status === "reciting") return "badge-reciting";
  if (status === "done") return "badge-done";
  return "badge-waiting";
}
