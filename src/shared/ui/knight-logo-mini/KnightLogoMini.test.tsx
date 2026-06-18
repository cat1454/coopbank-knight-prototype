import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KnightLogoMini } from "./KnightLogoMini";

describe("KnightLogoMini", () => {
  it("renders the system logo asset at the requested size", () => {
    render(<KnightLogoMini size={48} className="custom-logo" />);

    const logo = screen.getByRole("img", { name: "Logo hệ thống KNIGHT" });

    expect(logo).toHaveAttribute("src", "/logo.png");
    expect(logo).toHaveAttribute("width", "48");
    expect(logo).toHaveAttribute("height", "48");
    expect(logo).toHaveClass(
      "knight-logo-mini",
      "knight-logo-mini--highlighted",
      "custom-logo",
    );
  });
});
