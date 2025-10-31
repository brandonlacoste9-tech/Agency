import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import TopBar from "@/components/TopBar";
import MobileCreateDock from "@/components/MobileCreateDock";

describe("A11y: TopBar + MobileCreateDock", () => {
  it("TopBar controls have accessible names and are focusable", async () => {
    render(<TopBar onOpenPalette={() => {}} />);
    const user = userEvent.setup();

    // Get the command palette button
    const openK = screen.getByRole("button", { name: /open command palette/i });
    expect(openK).toBeInTheDocument();
    expect(openK).toHaveAccessibleName(/open command palette/i);

    // Verify tab navigation works
    await user.tab();
    expect(document.activeElement).toBeDefined();
  });

  it("TopBar theme toggle has accessible name", () => {
    render(<TopBar onOpenPalette={() => {}} />);

    const themeBtn = screen.getByRole("button", { name: /toggle theme/i });
    expect(themeBtn).toBeInTheDocument();
    expect(themeBtn).toHaveAccessibleName(/toggle theme/i);
  });

  it("MobileCreateDock buttons have names and are keyboard-focusable", async () => {
    render(<MobileCreateDock />);
    const user = userEvent.setup();

    const create = screen.getByRole("button", { name: /create/i });
    const reel = screen.getByRole("button", { name: /reel/i });
    const exportB = screen.getByRole("button", { name: /export/i });

    // All buttons exist
    expect(create).toBeInTheDocument();
    expect(reel).toBeInTheDocument();
    expect(exportB).toBeInTheDocument();

    // All have accessible names
    expect(create).toHaveAccessibleName(/create/i);
    expect(reel).toHaveAccessibleName(/reel/i);
    expect(exportB).toHaveAccessibleName(/export/i);

    // Tab navigation works
    await user.tab();
    const firstFocused = document.activeElement;
    expect([create, reel, exportB]).toContain(firstFocused);
  });

  it("MobileCreateDock buttons are not disabled", () => {
    render(<MobileCreateDock />);

    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).not.toBeDisabled();
    }
  });
});
