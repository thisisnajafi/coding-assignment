import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Bot, CircleDot, Cpu, KeyRound, LifeBuoy, Minus, Monitor, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, PRIORITY_LABELS, SOURCE_LABELS, STATUS_LABELS, label } from "@/lib/labels";
import { cn } from "@/lib/utils";

// One color per value, used everywhere (cards, rows, detail) so meaning stays consistent.
export const STATUS_STYLES: Record<string, string> = {
  open: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  closed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

export const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  medium: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
};

export const CATEGORY_STYLES: Record<string, string> = {
  hardware: "border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300",
  network: "border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-300",
  software: "border-fuchsia-200 text-fuchsia-700 dark:border-fuchsia-800 dark:text-fuchsia-300",
  access: "border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-300",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = { hardware: Cpu, network: Wifi, software: Monitor, access: KeyRound };
const PRIORITY_ICONS: Record<string, LucideIcon> = { low: ArrowDown, medium: Minus, high: ArrowUp };

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge data-testid="status-badge" className={cn("border-0", STATUS_STYLES[status])}>
      <CircleDot aria-hidden />
      {label(STATUS_LABELS, status)}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category?: string | null }) {
  const Icon = (category && CATEGORY_ICONS[category]) || null;
  return (
    <Badge variant="outline" className={cn(category && CATEGORY_STYLES[category])}>
      {Icon && <Icon aria-hidden />}
      {label(CATEGORY_LABELS, category)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const Icon = (priority && PRIORITY_ICONS[priority]) || null;
  return (
    <Badge className={cn("border-0", priority ? PRIORITY_STYLES[priority] : "bg-muted text-muted-foreground")}>
      {Icon && <Icon aria-hidden />}
      اولویت: {label(PRIORITY_LABELS, priority)}
    </Badge>
  );
}

export function SourceBadge({ source }: { source?: string | null }) {
  const isAi = source === "ai";
  return (
    <Badge
      data-testid="source-badge"
      className={cn(
        "border-0",
        isAi ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
      )}
    >
      {isAi ? <Bot aria-hidden /> : <LifeBuoy aria-hidden />}
      {label(SOURCE_LABELS, source)}
    </Badge>
  );
}

export function TicketBadges({ ticket }: { ticket: { status: string; category?: string | null; priority?: string | null } }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={ticket.status} />
      <CategoryBadge category={ticket.category} />
      <PriorityBadge priority={ticket.priority} />
    </div>
  );
}
