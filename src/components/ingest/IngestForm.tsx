"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "ok"; id: string }
  | { kind: "error"; message: string };

export function IngestForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "uploading" });
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

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 grid gap-4 rounded-lg border border-lines bg-paper p-5"
    >
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

      <Field label="Upload files (PDF / PPTX / DOCX / .txt — multiple allowed)">
        <input
          type="file"
          name="files"
          multiple
          accept=".pdf,application/pdf,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.txt,.md"
          className="text-sm"
        />
      </Field>

      <Field label="Or paste raw text">
        <textarea
          name="text"
          rows={6}
          placeholder="Paste lecture notes / exam content here"
          className="rounded-md border border-lines px-2 py-1 font-mono text-xs"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === "uploading"}
          className="rounded-md bg-navy px-3 py-1.5 text-sm font-semibold text-paper hover:brightness-110 disabled:opacity-50"
        >
          {state.kind === "uploading" ? "Structuring…" : "Ingest"}
        </button>
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
