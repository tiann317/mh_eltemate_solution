/**
 * Smoke tests — intake screens render with empty FormState
 * ---------------------------------------------------------
 * Goal: prove that each Screen mounts cleanly when handed an empty
 * `initialState` (i.e. no auto-filled data). This guards against the bug
 * class where jumping to a later step (Screen 3 / 3.5 / Review) crashes
 * because earlier-step data is missing.
 *
 * These are intentionally shallow: we do NOT walk the full flow, do NOT
 * fill fields, and do NOT exercise validation. We only assert the screens
 * mount and their primary heading is present.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { initialState, FormState } from "@/lib/aegis";
import { Screen1 } from "@/components/Screen1";
import { Screen2 } from "@/components/Screen2";
import { Screen3 } from "@/components/Screen3";
import { Screen35 } from "@/components/Screen35";
import { ScreenReview } from "@/components/ScreenReview";

const noop = () => {};
const setState = (_s: FormState) => {};

describe("intake screens — empty-state smoke tests", () => {
  it("Screen1 renders with empty FormState (no auto-fill)", () => {
    render(<Screen1 state={initialState} setState={setState} onNext={noop} />);
    expect(screen.getByRole("heading", { name: /Discovery/i })).toBeInTheDocument();
    // Discovery time field is empty
    const discovery = screen.getByLabelText(/Date and time of discovery/i) as HTMLInputElement;
    expect(discovery.value).toBe("");
  });

  it("Screen2 renders with empty FormState", () => {
    render(
      <Screen2 state={initialState} setState={setState} onBack={noop} onNext={noop} />,
    );
    expect(screen.getByRole("heading", { name: /Data Categories/i })).toBeInTheDocument();
    // No data categories selected — Next is disabled
    const next = screen.getByRole("button", { name: /Next: organisation/i });
    expect(next).toBeDisabled();
  });

  it("Screen3 renders with empty FormState (jump-to-step-3 entry point)", () => {
    render(
      <Screen3
        state={initialState}
        setState={setState}
        onBack={noop}
        onNext={noop}
        loading={false}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Organisation, Sector/i }),
    ).toBeInTheDocument();
    const sector = screen.getByLabelText(/^Sector/i) as HTMLSelectElement;
    expect(sector.value).toBe("");
    const continueBtn = screen.getByRole("button", { name: /Continue to legal context/i });
    expect(continueBtn).toBeDisabled();
  });

  it("Screen35 renders with empty FormState", () => {
    render(
      <Screen35 state={initialState} setState={setState} onBack={noop} onNext={noop} />,
    );
    // Heading text varies; assert the back button at minimum
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
  });

  it("ScreenReview renders with empty FormState without crashing", () => {
    // ScreenReview consumes a lot of optional fields — must not throw on empties.
    const onEdit = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ScreenReview
        state={initialState}
        onBack={noop}
        onEdit={onEdit}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
  });
});
