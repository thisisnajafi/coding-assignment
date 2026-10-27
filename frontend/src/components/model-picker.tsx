"use client";

import { useMemo, useState } from "react";
import { Bot, Check, ChevronsUpDown, Sparkle, Sparkles, Waves, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { filterModelGroups, providerOf, type ModelGroup } from "@/lib/models";
import { cn } from "@/lib/utils";

const PROVIDER_ICONS: Record<string, LucideIcon> = { openai: Sparkles, google: Sparkle, anthropic: Bot, deepseek: Waves };
const PROVIDER_COLORS: Record<string, string> = {
  openai: "text-emerald-600",
  google: "text-blue-600",
  anthropic: "text-orange-600",
  deepseek: "text-indigo-600",
};

function ProviderIcon({ provider, className }: { provider?: string; className?: string }) {
  const Icon = (provider && PROVIDER_ICONS[provider]) || Zap;
  return <Icon className={cn("size-4", provider && PROVIDER_COLORS[provider], className)} aria-hidden />;
}

/** Searchable model combobox grouped by provider (shadcn Command inside a Popover). */
export function ModelPicker({
  groups,
  value,
  onChange,
  loading,
  disabled,
}: {
  groups: ModelGroup[];
  value: string;
  onChange: (model: string) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterModelGroups(groups, query), [groups, query]);
  const current = providerOf(groups, value);

  if (loading) return <Skeleton data-testid="model-picker-skeleton" className="h-9 w-48 rounded-lg" />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label="انتخاب مدل هوش مصنوعی"
        data-testid="model-picker"
        className="inline-flex h-9 min-w-48 items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ProviderIcon provider={current?.provider} />
          <span dir="ltr" className="truncate font-mono text-xs">{value}</span>
        </span>
        <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="جستجوی مدل یا ارائه‌دهنده…" value={query} onValueChange={setQuery} aria-label="جستجوی مدل" />
          <CommandList>
            <CommandEmpty>مدلی یافت نشد.</CommandEmpty>
            {visible.map((g) => (
              <CommandGroup
                key={g.provider}
                heading={
                  <span className="flex items-center gap-1.5">
                    <ProviderIcon provider={g.provider} className="size-3.5" />
                    {g.label}
                  </span>
                }
              >
                {g.models.map((m) => (
                  <CommandItem
                    key={m}
                    value={m}
                    onSelect={() => {
                      onChange(m);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check className={cn("size-4", m === value ? "opacity-100" : "opacity-0")} aria-hidden />
                    <span dir="ltr" className="font-mono text-xs">{m}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
