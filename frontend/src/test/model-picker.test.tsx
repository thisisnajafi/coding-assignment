import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { filterModelGroups, type ModelGroup } from "@/lib/models";
import { ModelPicker } from "@/components/model-picker";

const groups: ModelGroup[] = [
  { provider: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4.1"] },
  { provider: "google", label: "Google Gemini", models: ["gemini-2.5-flash"] },
  { provider: "anthropic", label: "Anthropic Claude", models: ["claude-sonnet-4-5"] },
  { provider: "deepseek", label: "DeepSeek", models: ["deepseek-chat"] },
];

describe("filterModelGroups", () => {
  it("returns everything for an empty query", () => {
    expect(filterModelGroups(groups, "  ")).toEqual(groups);
  });
  it("matches model ids case-insensitively and drops empty groups", () => {
    expect(filterModelGroups(groups, "4.1")).toEqual([{ ...groups[0], models: ["gpt-4.1"] }]);
    expect(filterModelGroups(groups, "SONNET").map((g) => g.provider)).toEqual(["anthropic"]);
  });
  it("matches provider names and returns all of that provider's models", () => {
    expect(filterModelGroups(groups, "claude")).toEqual([groups[2]]);
    expect(filterModelGroups(groups, "gemini")).toEqual([groups[1]]);
  });
  it("returns nothing for an unknown query", () => {
    expect(filterModelGroups(groups, "llama")).toEqual([]);
  });
});

describe("ModelPicker", () => {
  it("shows a skeleton while loading and the current model otherwise", () => {
    const { rerender } = render(<ModelPicker groups={groups} value="gpt-4o" onChange={vi.fn()} loading />);
    expect(screen.getByTestId("model-picker-skeleton")).toBeInTheDocument();
    rerender(<ModelPicker groups={groups} value="gpt-4o" onChange={vi.fn()} />);
    expect(screen.getByTestId("model-picker")).toHaveTextContent("gpt-4o");
  });
});
