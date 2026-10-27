import { CalendarClock, Hash, User } from "lucide-react";
import { formatDate } from "@/lib/labels";

/** Secondary info row: #id, optional owner, creation date. */
export function TicketMeta({ id, owner, createdAt }: { id: number; owner?: string; createdAt: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-0.5" aria-label={`شماره تیکت ${id}`}>
        <Hash className="size-3" aria-hidden />
        {id.toLocaleString("fa-IR")}
      </span>
      {owner && (
        <span className="inline-flex items-center gap-1">
          <User className="size-3" aria-hidden />
          {owner}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <CalendarClock className="size-3" aria-hidden />
        <time dateTime={createdAt}>{formatDate(createdAt)}</time>
      </span>
    </div>
  );
}
