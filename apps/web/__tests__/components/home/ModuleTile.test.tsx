import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleTile } from "@/components/home/ModuleTile";

// Mock telemetry
vi.mock("@/lib/telemetry", () => ({
  trackEvent: vi.fn(),
}));

describe("ModuleTile", () => {
  const defaultProps = {
    id: "tasks",
    href: "/taskflow",
    title: "Tasks",
    description: "Manage your tasks",
    icon: <span>icon</span>,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  };

  it("renders tile with title and description", () => {
    render(<ModuleTile {...defaultProps} />);
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Manage your tasks")).toBeInTheDocument();
  });

  it("renders badge when provided", () => {
    render(<ModuleTile {...defaultProps} badge={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders coming soon label when comingSoon is true", () => {
    render(<ModuleTile {...defaultProps} comingSoon />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<ModuleTile {...defaultProps} disabled />);
    const tile = screen.getByRole("button");
    expect(tile).toHaveAttribute("aria-disabled", "true");
  });

  it("has correct aria-label for accessibility", () => {
    render(<ModuleTile {...defaultProps} badge={3} />);
    expect(screen.getByLabelText("Open Tasks (3)")).toBeInTheDocument();
  });
});