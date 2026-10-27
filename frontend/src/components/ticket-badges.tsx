import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, PRIORITY_LABELS, SOURCE_LABELS, STATUS_LABELS, label } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Bot, LifeBuoy } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  closed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn("border-0", STATUS_STYLES[status])}>{label(STATUS_LABELS, status)}</Badge>;
}

export function CategoryBadge({ category }: { category?: string | null }) {
  return <Badge variant="outline">{label(CATEGORY_LABELS, category)}</Badge>;
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  return (
    <Badge className={cn("border-0", priority ? PRIORITY_STYLES[priority] : "bg-muted text-muted-foreground")}>
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
        isAi ? "bg-violet-100 text-violet-800" : "bg-zinc-200 text-zinc-700",
      )}
    >
      {isAi ? <Bot /> : <LifeBuoy />}
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
