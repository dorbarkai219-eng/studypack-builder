import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DeckViewer } from "./DeckViewer";
import { hebrewFinancePack } from "@/lib/coursepack/mocks/hebrew-finance";
import { englishBiologyPack } from "@/lib/coursepack/mocks/english-biology";

describe("DeckViewer navigation", () => {
  it("renders the title slide first with counter 1 / N", () => {
    render(<DeckViewer pack={englishBiologyPack} />);
    expect(screen.getByText(/^1 \//)).toBeInTheDocument();
    // title appears in toolbar + on the title slide
    expect(screen.getAllByText("Cell Biology & Genetics").length).toBeGreaterThanOrEqual(1);
  });

  it("ArrowRight advances in an LTR deck", () => {
    render(<DeckViewer pack={englishBiologyPack} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(/^2 \//)).toBeInTheDocument();
  });

  it("ArrowLeft advances in an RTL deck (arrow flip, spec §6)", () => {
    render(<DeckViewer pack={hebrewFinancePack} />);
    expect(screen.getByText(/^1 \//)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText(/^2 \//)).toBeInTheDocument();
  });

  it("End jumps to the last slide", () => {
    render(<DeckViewer pack={englishBiologyPack} />);
    fireEvent.keyDown(window, { key: "End" });
    // counter shows N / N
    const counter = screen.getByText(/\d+ \/ \d+/).textContent!;
    const [cur, total] = counter.split("/").map((s) => Number(s.trim()));
    expect(cur).toBe(total);
  });

  it("TOC entry click jumps to that block's slide", () => {
    render(<DeckViewer pack={englishBiologyPack} />);
    // go to TOC (slide 2)
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const toc = screen.getByRole("list");
    const firstEntry = within(toc).getAllByRole("button")[0];
    fireEvent.click(firstEntry);
    // now off the TOC — counter moved past slide 2
    const counter = screen.getByText(/\d+ \/ \d+/).textContent!;
    const cur = Number(counter.split("/")[0].trim());
    expect(cur).toBeGreaterThan(2);
  });

  it("download link points at the export route", () => {
    render(<DeckViewer pack={hebrewFinancePack} />);
    const link = screen.getByText("הורד HTML").closest("a")!;
    expect(link).toHaveAttribute("href", "/deck/hebrew-finance/export");
    expect(link).toHaveAttribute("download");
  });
});
