export interface ModelGroup {
  provider: string;
  label: string;
  models: string[];
}

/** Used until the backend answers (or if it cannot): mirrors the backend allowlist default. */
export const DEFAULT_GROUPS: ModelGroup[] = [{ provider: "openai", label: "OpenAI", models: ["gpt-4o"] }];

/** Case-insensitive search on model id or provider name/label; empty groups are dropped. */
export function filterModelGroups(groups: ModelGroup[], query: string): ModelGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => {
      const providerHit = g.label.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q);
      return { ...g, models: providerHit ? g.models : g.models.filter((m) => m.toLowerCase().includes(q)) };
    })
    .filter((g) => g.models.length > 0);
}

export function providerOf(groups: ModelGroup[], model: string): ModelGroup | undefined {
  return groups.find((g) => g.models.includes(model));
}
