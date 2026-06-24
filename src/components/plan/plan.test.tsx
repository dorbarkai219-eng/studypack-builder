import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanView } from "./PlanView";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("PlanView persistence (spec §4.5, §11 #6)", () => {
  beforeEach(() => localStorage.clear());

  it("renders day cards with learn + practice checkboxes", () => {
    render(<PlanView pack={englishBiologyPack} />);
    expect(screen.getAllByText(/Day 1/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("checking a task persists to localStorage", () => {
    render(<PlanView pack={englishBiologyPack} />);
    const box = screen.getAllByRole("checkbox")[0] as HTMLInputElement;
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(box.checked).toBe(true);
    const stored = JSON.parse(
      localStorage.getItem("studypack:plan:english-biology")!,
    );
    expect(Object.values(stored).some((v) => v === true)).toBe(true);
  });

  it("restores checked state on remount (survives reload)", () => {
    localStorage.setItem(
      "studypack:plan:english-biology",
      JSON.stringify({ "d1-learn-0": true }),
    );
    render(<PlanView pack={englishBiologyPack} />);
    const box = screen.getAllByRole("checkbox")[0] as HTMLInputElement;
    expect(box.checked).toBe(true);
  });

  it("progress bar reflects completion and reset clears it", () => {
    render(<PlanView pack={englishBiologyPack} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Reset"));
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });
});
