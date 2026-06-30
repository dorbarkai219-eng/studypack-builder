"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StudyClass } from "@/lib/classes/schema";

type LoadState =
  | { kind: "loading" }
  | { kind: "ok"; owned: StudyClass[]; member: StudyClass[] }
  | { kind: "error"; message: string };

type ActionState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function ClassesView() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [createState, setCreateState] = useState<ActionState>({ kind: "idle" });
  const [joinState, setJoinState] = useState<ActionState>({ kind: "idle" });

  async function load() {
    setState({ kind: "loading" });
    try {
      const r = await fetch("/api/classes");
      if (r.status === 401) {
        setState({
          kind: "error",
          message: "Sign in is required to use classes.",
        });
        return;
      }
      const j = (await r.json()) as {
        owned?: StudyClass[];
        member?: StudyClass[];
        error?: string;
      };
      if (!r.ok || !j.owned)
        return setState({ kind: "error", message: j.error ?? `HTTP ${r.status}` });
      setState({ kind: "ok", owned: j.owned, member: j.member ?? [] });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }
  // Client-side fetch on mount — the setState inside `load` is fine here
  // (mount-only kickoff, no cascading render loop). The rule below catches
  // a different anti-pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateState({ kind: "pending" });
    const data = new FormData(e.currentTarget);
    const body = {
      id: String(data.get("id") ?? ""),
      name: String(data.get("name") ?? ""),
      packIds: String(data.get("packIds") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const r = await fetch("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok)
        return setCreateState({ kind: "error", message: j.error ?? `HTTP ${r.status}` });
      setCreateState({ kind: "ok", message: "Class created." });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setCreateState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  async function onJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setJoinState({ kind: "pending" });
    const data = new FormData(e.currentTarget);
    const body = {
      code: String(data.get("code") ?? "").toUpperCase(),
      label: String(data.get("label") ?? "") || undefined,
    };
    try {
      const r = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok)
        return setJoinState({ kind: "error", message: j.error ?? `HTTP ${r.status}` });
      setJoinState({ kind: "ok", message: "Joined." });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setJoinState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return (
    <div className="mt-6 grid gap-6">
      <section className="grid gap-3 rounded-xl border border-lines bg-paper p-5 shadow-sm">
        <h2 className="m-0 text-base font-bold text-ink">Create a class (teacher)</h2>
        <p className="m-0 text-xs text-muted">
          Publish one or more demo packs to the class. Each created class gets a
          6-character join code your students will enter.
        </p>
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
          <input
            name="id"
            placeholder="class id (slug, e.g. fin-2025)"
            required
            pattern="^[a-z0-9][a-z0-9-]{1,40}$"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
          <input
            name="name"
            placeholder="display name"
            required
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
          <input
            name="packIds"
            placeholder="pack ids (comma sep, e.g. hebrew-finance,english-biology)"
            className="rounded-md border border-lines px-2 py-1 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            disabled={createState.kind === "pending"}
            className="rounded-md bg-navy px-3 py-1.5 text-sm font-semibold text-paper hover:brightness-110 disabled:opacity-50"
          >
            {createState.kind === "pending" ? "Creating…" : "Create class"}
          </button>
          {createState.kind === "error" && (
            <span className="self-center text-sm text-mistake">
              {createState.message}
            </span>
          )}
          {createState.kind === "ok" && (
            <span className="self-center text-sm text-tip">{createState.message}</span>
          )}
        </form>
      </section>

      <section className="grid gap-3 rounded-xl border border-lines bg-paper p-5 shadow-sm">
        <h2 className="m-0 text-base font-bold text-ink">Join a class (student)</h2>
        <form onSubmit={onJoin} className="grid gap-3 sm:grid-cols-2">
          <input
            name="code"
            placeholder="6-char join code"
            required
            pattern="^[A-Za-z0-9]{6}$"
            className="rounded-md border border-lines px-2 py-1 font-mono uppercase text-sm tracking-widest"
          />
          <input
            name="label"
            placeholder="your name (optional)"
            className="rounded-md border border-lines px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={joinState.kind === "pending"}
            className="rounded-md bg-orange px-3 py-1.5 text-sm font-semibold text-paper hover:brightness-95 disabled:opacity-50"
          >
            {joinState.kind === "pending" ? "Joining…" : "Join"}
          </button>
          {joinState.kind === "error" && (
            <span className="self-center text-sm text-mistake">{joinState.message}</span>
          )}
          {joinState.kind === "ok" && (
            <span className="self-center text-sm text-tip">{joinState.message}</span>
          )}
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Your classes
        </h2>
        {state.kind === "loading" && (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        )}
        {state.kind === "error" && (
          <p className="mt-2 text-sm text-mistake">{state.message}</p>
        )}
        {state.kind === "ok" && (
          <>
            <ClassList title="As teacher" classes={state.owned} showCode />
            <ClassList title="As student" classes={state.member} />
            {state.owned.length + state.member.length === 0 && (
              <div className="mt-2 rounded-xl border-2 border-dashed border-lines bg-paper/60 p-6 text-center">
                <p className="m-0 text-sm text-ink">
                  No classes yet — create one above, or join with a code.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function ClassList({
  title,
  classes,
  showCode,
}: {
  title: string;
  classes: StudyClass[];
  showCode?: boolean;
}) {
  if (classes.length === 0) return null;
  return (
    <div className="mt-3">
      <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <ul className="m-0 mt-2 grid list-none gap-2 p-0">
        {classes.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-lines bg-paper p-3 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-bold text-ink">{c.name}</span>
              {showCode && (
                <span className="rounded bg-orange/15 px-1.5 py-0.5 font-mono text-xs font-bold text-orange tracking-widest">
                  {c.joinCode}
                </span>
              )}
            </div>
            <p className="m-0 mt-1 text-xs text-muted">
              {c.members.length} member{c.members.length === 1 ? "" : "s"} ·{" "}
              {c.packIds.length} pack{c.packIds.length === 1 ? "" : "s"}
            </p>
            {c.packIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.packIds.map((p) => (
                  <Link
                    key={p}
                    href={`/cheatsheet/${p}`}
                    className="rounded-md border border-lines bg-paper px-2 py-0.5 text-xs text-ink hover:bg-lines/40"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
