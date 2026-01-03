import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TileGrid } from "@/components/home/TileGrid";

vi.mock("@/lib/telemetry", () => ({
  trackEvent: vi.fn(),
}));

describe("TileGrid", () => {
  const mockTiles = [
    {
      id: "tasks",
      href: "/taskflow",
      title: "Tasks",
      description: "Manage tasks",
      icon: <span>icon</span>,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
    },
    {
      id: "meetings",
      href: "/meetingflow",
      title: "Meetings",
      description: "Manage meetings",
      icon: <span>icon</span>,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      badge: 3,
    },
  ];

  it("renders all tiles", () => {
    render(<TileGrid tiles={mockTiles} />);
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Meetings")).toBeInTheDocument();
  });

  it("renders empty state when no tiles", () => {
    render(<TileGrid tiles={[]} />);
    expect(screen.getByText("No modules available")).toBeInTheDocument();
  });

  it("renders badges on tiles that have them", () => {
    render(<TileGrid tiles={mockTiles} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(<TileGrid tiles={mockTiles} />);
    expect(screen.getByRole("list")).toHaveAttribute("aria-label", "Available modules");
  });
});