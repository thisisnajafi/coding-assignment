import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Placeholder shaped like an employee ticket card (title, meta, badges, body, reply line). */
export function TicketCardSkeleton() {
  return (
    <Card data-testid="ticket-card-skeleton">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
    </Card>
  );
}

/** Placeholder shaped like a compact IT list row. */
export function TicketRowSkeleton() {
  return (
    <div data-testid="ticket-row-skeleton" className="space-y-2 rounded-xl border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-6" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3, variant = "card" }: { rows?: number; variant?: "card" | "row" }) {
  const Item = variant === "row" ? TicketRowSkeleton : TicketCardSkeleton;
  return (
    <div data-testid="list-skeleton" className={variant === "row" ? "space-y-2" : "space-y-3"} aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}

/** Lines shaped like the AI suggestion text, shown while a suggestion is (re)generated. */
export function SuggestionSkeleton() {
  return (
    <div data-testid="suggestion-skeleton" className="space-y-2" aria-busy="true">
      <span className="sr-only">در حال تولید پیشنهاد…</span>
      <Skeleton className="h-4 w-1/4 bg-violet-200/60 dark:bg-violet-900/40" />
      <Skeleton className="h-4 w-full bg-violet-200/60 dark:bg-violet-900/40" />
      <Skeleton className="h-4 w-11/12 bg-violet-200/60 dark:bg-violet-900/40" />
      <Skeleton className="h-4 w-3/5 bg-violet-200/60 dark:bg-violet-900/40" />
    </div>
  );
}

/** Whole page placeholder used before the demo user is known. */
export function PageSkeleton() {
  return (
    <div data-testid="page-skeleton" className="space-y-4" aria-busy="true">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Skeleton className="h-72 w-full rounded-xl" />
        <ListSkeleton rows={2} />
      </div>
    </div>
  );
}

export function EmptyState({ text, hint, icon: Icon = Inbox }: { text: string; hint?: string; icon?: LucideIcon }) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background px-4 py-10 text-center text-muted-foreground"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground/80">{text}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-8 text-destructive">
      <AlertTriangle className="size-7" aria-hidden />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          تلاش دوباره
        </Button>
      )}
    </div>
  );
}

/** Placeholder shaped like the IT ticket detail panel (header, body, status, suggestion, reply). */
export function DetailSkeleton() {
  return (
    <Card data-testid="detail-skeleton" aria-busy="true">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
