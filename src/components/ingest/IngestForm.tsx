"use client";

import { useEffect, useRef, useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; startedAt: number }
  | { kind: "ok"; id: string }
  | { kind: "error"; message: string };

const MAX_BYTES_PER_FILE = 15 * 1024 * 1024;
const MAX_BYTES_PER_REQUEST = 25 * 1024 * 1024;
const MAX_FILES = 8;

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function IngestForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [selected, setSelected] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Live elapsed-seconds counter while the request is in flight.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (state.kind !== "uploading") return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - state.startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [state]);

  const totalBytes = selected.reduce((n, f) => n + f.size, 0);
  const over =
    selected.length > MAX_FILES ||
    selected.some((f) => f.size > MAX_BYTES_PER_FILE) ||
    totalBytes > MAX_BYTES_PER_REQUEST;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "uploading", startedAt: Date.now() });
    setElapsed(0);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/ingest", { method: "POST", body: data });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok || !json.id) {
        setState({ kind: "error", message: json.error ?? `HTTP ${res.status}` });
        return;
      }
      setState({ kind: "ok", id: json.id });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  // Map elapsed time to a 0..90% progress bar against a 60s expected upper
  // bound (we never claim 100% — that lands on success).
  const progressPct =
    state.kind === "uploading"
      ? Math.min(90, Math.round((elapsed / 60) * 90))
      : state.kind === "ok"
        ? 100
        : 0;

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 grid gap-5 rounded-xl border border-lines bg-paper p-5 shadow-sm"
    >
      <SectionHeader index={1} title="Course meta" />
      <Field label="Pack id (slug, used in the URL)">
        <input
          name="id"
          required
          placeholder="my-course"
          pattern="^[a-z0-9][a-z0-9-]{1,40}$"
          className="rounded-md border border-lines px-2 py-1 text-sm"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Course title">
          <input
            name="title"
            required
            placeholder="Corporate Finance"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Subject">
          <input
            name="subject"
            required
            placeholder="Finance"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Source language">
          <input
            name="language"
            required
            placeholder="he"
            defaultValue="en"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Output language">
          <input
            name="outputLanguage"
            placeholder="en"
            defaultValue="en"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Direction">
          <select
            name="direction"
            defaultValue="ltr"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          >
            <option value="ltr">ltr</option>
            <option value="rtl">rtl</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Exam date (YYYY-MM-DD)">
          <input
            name="examDate"
            required
            placeholder="2026-07-10"
            pattern="^\d{4}-\d{2}-\d{2}$"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Weak topics (comma separated)">
          <input
            name="weakTopics"
            placeholder="WACC, derivatives"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
        </Field>
      </div>

      <SectionHeader
        index={2}
        title="Materials"
        subtitle={`PDF · PPTX · DOCX · text — up to ${MAX_FILES} files, ${MAX_BYTES_PER_REQUEST / 1024 / 1024} MB total`}
      />
      <Field
        label={`Upload files (PDF / PPTX / DOCX / .txt — up to ${MAX_FILES} files, ${MAX_BYTES_PER_REQUEST / 1024 / 1024} MB total)`}
      >
        <input
          ref={fileRef}
          type="file"
          name="files"
          multiple
          accept=".pdf,application/pdf,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.txt,.md"
          className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-lines bg-[#f7f9fc] px-3 py-4 text-sm transition-colors hover:border-keyidea hover:bg-keyidea-bg/50"
          onChange={(e) => setSelected(Array.from(e.target.files ?? []))}
        />
        {selected.length > 0 && (
          <ul className="m-0 mt-2 grid list-none gap-1 rounded-md border border-lines bg-[#f7f9fc] p-2 text-xs">
            {selected.map((f) => (
              <li
                key={`${f.name}-${f.size}`}
                className={`flex items-baseline justify-between gap-2 ${
                  f.size > MAX_BYTES_PER_FILE ? "text-[#c0322b]" : "text-ink"
                }`}
              >
                <span className="font-mono">{f.name}</span>
                <span className="text-muted">{fmtBytes(f.size)}</span>
              </li>
            ))}
            <li className="mt-1 flex items-baseline justify-between gap-2 border-t border-lines pt-1 text-[10px] uppercase tracking-wide text-muted">
              <span>
                {selected.length}/{MAX_FILES} files
              </span>
              <span className={over ? "font-bold text-[#c0322b]" : ""}>
                {fmtBytes(totalBytes)} / {MAX_BYTES_PER_REQUEST / 1024 / 1024} MB
              </span>
            </li>
          </ul>
        )}
      </Field>

      <Field label="Or paste raw text">
        <textarea
          name="text"
          rows={6}
          placeholder="Paste lecture notes / exam content here"
          className="rounded-md border border-lines px-2 py-1 font-mono text-xs"
        />
      </Field>

      <SectionHeader index={3} title="Submit" />
      {(state.kind === "uploading" || state.kind === "ok") && (
        <div className="grid gap-1">
          <div className="flex items-baseline justify-between text-xs text-muted">
            <span>
              {state.kind === "uploading"
                ? `Claude is structuring your CoursePack… ${elapsed}s`
                : "Done"}
            </span>
            <span className="font-mono">{progressPct}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-lines/60"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-navy transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === "uploading" || over}
          className="rounded-md bg-navy px-3 py-1.5 text-sm font-semibold text-paper hover:brightness-110 disabled:opacity-50"
        >
          {state.kind === "uploading" ? `Structuring… ${elapsed}s` : "Ingest"}
        </button>
        {state.kind === "uploading" && (
          <span className="text-xs text-muted">
            Claude is reading {selected.length || "your"} source
            {selected.length === 1 ? "" : "s"} — usually ~30s.
          </span>
        )}
        {state.kind === "error" && (
          <span className="text-sm text-[#c0322b]">{state.message}</span>
        )}
        {state.kind === "ok" && (
          <span className="text-sm text-[#15803d]">
            Ingested as <code className="font-mono">{state.id}</code> —{" "}
            <a className="underline" href={`/cheatsheet/${state.id}`}>
              cheat sheet
            </a>{" "}
            ·{" "}
            <a className="underline" href={`/deck/${state.id}`}>
              deck
            </a>{" "}
            ·{" "}
            <a className="underline" href={`/plan/${state.id}`}>
              plan
            </a>{" "}
            ·{" "}
            <a className="underline" href={`/verify/${state.id}`}>
              verify
            </a>
          </span>
        )}
        {over && state.kind === "idle" && (
          <span className="text-xs text-[#c0322b]">
            Over the limit — remove a file or pick a smaller one
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-lines/60 pb-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-navy text-xs font-bold text-paper">
        {index}
      </span>
      <h3 className="m-0 text-sm font-bold text-ink">{title}</h3>
      {subtitle && <span className="text-xs text-muted">— {subtitle}</span>}
    </div>
  );
}
