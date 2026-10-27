import { CheckCircle2, Headset } from "lucide-react";
import { PlainText } from "@/components/plain-text";
import { formatDate } from "@/lib/labels";

/** The IT agent's final answer, shown to the owner and (read-only) to IT once sent. */
export function FinalReply({ text, repliedAt, repliedBy, note }: { text: string; repliedAt?: string | null; repliedBy?: string | null; note?: string }) {
  return (
    <div data-testid="final-reply" className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Headset className="size-4" aria-hidden />
          </span>
          پاسخ پشتیبانی{repliedBy ? ` · ${repliedBy}` : ""}
        </div>
        {repliedAt && (
          <time dateTime={repliedAt} className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
            {formatDate(repliedAt)}
          </time>
        )}
      </div>
      <PlainText text={text} className="text-sm leading-7" />
      {note && (
        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5" aria-hidden /> {note}
        </p>
      )}
    </div>
  );
}
