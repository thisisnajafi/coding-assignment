"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { CheckCircle2, CornerDownLeft, Loader2, MessagesSquare, Reply, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PlainText } from "@/components/plain-text";
import { ErrorState } from "@/components/states";
import { api } from "@/lib/api";
import { ROLE_LABELS, formatDate, label } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

const MAX_LEN = 3000;

export function ThreadSkeleton() {
  return (
    <div data-testid="thread-skeleton" className="space-y-3" aria-busy="true">
      <span className="sr-only">در حال بارگذاری گفتگو…</span>
      <div className="flex justify-start">
        <Skeleton className="h-14 w-3/5 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-16 w-2/3 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Chat-style conversation for one ticket. Messages are untrusted text and are
 * rendered as plain text only. The viewer's own role is shown on the start side (right in RTL).
 */
export function TicketThread({ username, ticketId, viewerRole }: { username: string; ticketId: number; viewerRole: "employee" | "it" }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMessages(await api.messages(username, ticketId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "بارگذاری گفتگو ناموفق بود.");
    }
  }, [username, ticketId]);

  useEffect(() => {
    setMessages(null);
    setReplyTo(null);
    setText("");
    load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) {
      toast.error("متن پیام خالی است.");
      return;
    }
    setBusy(true);
    try {
      const m = await api.postMessage(username, ticketId, body, replyTo?.id);
      setMessages((prev) => [...(prev ?? []), m]);
      setText("");
      setReplyTo(null);
      toast.success("پیام ارسال شد.");
    } catch (err) {
      toast.error("ارسال پیام ناموفق بود.", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  function startReply(m: Message) {
    setReplyTo(m);
    inputRef.current?.focus();
  }

  return (
    <section aria-label="گفتگوی تیکت" className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessagesSquare className="size-4 text-primary" aria-hidden />
        گفتگو
        {messages && messages.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{messages.length.toLocaleString("fa-IR")}</span>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !messages ? (
        <ThreadSkeleton />
      ) : messages.length === 0 ? (
        <p data-testid="thread-empty" className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          هنوز پیامی ثبت نشده است. اولین پیام را بنویسید.
        </p>
      ) : (
        <ol className="max-h-96 space-y-3 overflow-y-auto pe-1" data-testid="thread-list">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={cn("flex", m.role === viewerRole ? "justify-start" : "justify-end")}
              >
                <Bubble message={m} own={m.role === viewerRole} onReply={() => startReply(m)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}

      <form onSubmit={send} className="space-y-2" aria-busy={busy}>
        {replyTo && (
          <div data-testid="reply-chip" className="flex items-start justify-between gap-2 rounded-lg border-s-4 border-primary bg-muted/60 px-3 py-2 text-xs">
            <div className="min-w-0">
              <div className="font-medium">پاسخ به {replyTo.author}</div>
              <p dir="auto" className="truncate text-muted-foreground">{replyTo.body}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-6" aria-label="لغو پاسخ" onClick={() => setReplyTo(null)}>
              <X aria-hidden />
            </Button>
          </div>
        )}
        <label htmlFor={`msg-${ticketId}`} className="sr-only">متن پیام</label>
        <Textarea
          ref={inputRef}
          id={`msg-${ticketId}`}
          rows={2}
          maxLength={MAX_LEN}
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e);
          }}
          placeholder="پیام خود را بنویسید… (Ctrl+Enter برای ارسال)"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {text.length.toLocaleString("fa-IR")} / {MAX_LEN.toLocaleString("fa-IR")}
          </span>
          <Button type="submit" size="sm" disabled={busy || !text.trim()}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            ارسال پیام
          </Button>
        </div>
      </form>
    </section>
  );
}

function Bubble({ message: m, own, onReply }: { message: Message; own: boolean; onReply: () => void }) {
  const it = m.role === "it";
  return (
    <div
      data-testid="thread-message"
      className={cn(
        "group max-w-[85%] space-y-1 rounded-2xl px-3 py-2 text-sm shadow-xs",
        it ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50" : "bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-50",
        own ? "rounded-ss-sm" : "rounded-se-sm",
        m.is_final && "ring-1 ring-emerald-400",
      )}
    >
      <div className="flex items-center gap-2 text-xs opacity-80">
        <span className="font-medium">{m.author}</span>
        <span>· {label(ROLE_LABELS, m.role)}</span>
        {m.is_final && (
          <span className="inline-flex items-center gap-0.5 font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3" aria-hidden /> پاسخ نهایی
          </span>
        )}
      </div>
      {m.reply_to && (
        <div data-testid="quoted-parent" className="flex gap-1 rounded-md border-s-2 border-current/40 bg-background/60 px-2 py-1 text-xs opacity-80">
          <CornerDownLeft className="mt-0.5 size-3 shrink-0" aria-hidden />
          <div className="min-w-0">
            <span className="font-medium">{m.reply_to.author}: </span>
            <span dir="auto">{m.reply_to.snippet}</span>
          </div>
        </div>
      )}
      <PlainText text={m.body} className="leading-7" />
      <div className="flex items-center justify-between gap-3 text-[11px] opacity-70">
        <time dateTime={m.created_at}>{formatDate(m.created_at)}</time>
        <button
          type="button"
          onClick={onReply}
          aria-label={`پاسخ به پیام ${m.author}`}
          className="inline-flex items-center gap-0.5 rounded px-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Reply className="size-3" aria-hidden /> پاسخ
        </button>
      </div>
    </div>
  );
}
