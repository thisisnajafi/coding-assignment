"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Inbox, Loader2, MousePointerClick, RefreshCw, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NativeSelect } from "@/components/native-select";
import { TicketBody } from "@/components/ticket-body";
import { TicketMeta } from "@/components/ticket-meta";
import { TicketThread } from "@/components/ticket-thread";
import { SuggestionPanel } from "@/components/suggestion-panel";
import { TicketBadges } from "@/components/ticket-badges";
import { EmptyState, ErrorState, DetailSkeleton, ListSkeleton } from "@/components/states";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, formatDate } from "@/lib/labels";
import { useTickets } from "@/lib/use-tickets";
import { cn } from "@/lib/utils";
import type { Status, Ticket } from "@/lib/types";

export function ItView({ username }: { username: string }) {
  const { tickets, error, loading, reload, upsert } = useTickets(username);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (tickets ?? []).filter(
      (t) =>
        (!status || t.status === status) &&
        (!category || t.category === category) &&
        (!priority || t.priority === priority) &&
        (!needle ||
          t.title.toLowerCase().includes(needle) ||
          t.body.toLowerCase().includes(needle) ||
          t.owner.toLowerCase().includes(needle)),
    );
  }, [tickets, q, status, category, priority]);

  const selected = tickets?.find((t) => t.id === selectedId) ?? null;
  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, in_progress: 0, closed: 0 };
    for (const t of tickets ?? []) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tickets]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(["open", "in_progress", "closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? "" : s)}
            aria-pressed={status === s}
            aria-label={`فیلتر وضعیت ${STATUS_LABELS[s]}`}
            className={cn(
              "rounded-xl border bg-background p-3 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              status === s && "border-primary ring-2 ring-primary/20",
            )}
          >
            <div className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</div>
            <div className="text-2xl font-bold">{tickets ? counts[s].toLocaleString("fa-IR") : "–"}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className={cn("space-y-3", selected && "hidden lg:block")}>
          <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-3">
            <div className="relative min-w-40 flex-1">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="جستجو" placeholder="جستجو در عنوان، متن یا کاربر" className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <FilterSelect label="وضعیت" value={status} onChange={setStatus} options={STATUS_LABELS} />
            <FilterSelect label="دسته" value={category} onChange={setCategory} options={CATEGORY_LABELS} />
            <FilterSelect label="اولویت" value={priority} onChange={setPriority} options={PRIORITY_LABELS} />
            <Button variant="ghost" size="icon" aria-label="بروزرسانی" onClick={reload} disabled={loading}>
              <RefreshCw className={cn(loading && "animate-spin")} />
            </Button>
          </div>
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !tickets ? (
            <ListSkeleton rows={4} variant="row" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={tickets.length ? SearchX : Inbox}
              text={tickets.length ? "تیکتی با این فیلترها یافت نشد." : "هیچ تیکتی وجود ندارد."}
              hint={tickets.length ? "فیلترها یا عبارت جستجو را تغییر دهید." : undefined}
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    data-testid="it-ticket-row"
                    onClick={() => setSelectedId(t.id)}
                    aria-current={selectedId === t.id ? "true" : undefined}
                    className={cn(
                      "w-full space-y-2 rounded-xl border bg-background p-3 text-start transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedId === t.id && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <span dir="auto" className="line-clamp-1 font-semibold">{t.title}</span>
                    <TicketMeta id={t.id} owner={t.owner} createdAt={t.created_at} />
                    <TicketBadges ticket={t} />
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn(!selected && "hidden lg:block")}>
          <AnimatePresence mode="wait">
            {!tickets && !error ? (
              <motion.div key="loading" exit={{ opacity: 0 }}>
                <DetailSkeleton />
              </motion.div>
            ) : selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TicketDetail username={username} ticket={selected} onChange={upsert} onBack={() => setSelectedId(null)} />
              </motion.div>
            ) : (
              <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState icon={MousePointerClick} text="برای مشاهده جزئیات، یک تیکت را انتخاب کنید." hint="پیشنهاد هوش مصنوعی و پاسخ نهایی اینجا نمایش داده می‌شود." />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Record<string, string>;
}) {
  return (
    <NativeSelect aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: همه</option>
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </NativeSelect>
  );
}

export function TicketDetail({
  username,
  ticket,
  onChange,
  onBack,
}: {
  username: string;
  ticket: Ticket;
  onChange: (t: Ticket) => void;
  onBack?: () => void;
}) {
  const [statusBusy, setStatusBusy] = useState(false);
  // Text pushed from the suggestion panel into the thread composer (nonce forces re-apply).
  const [draft, setDraft] = useState<{ text: string; nonce: number } | null>(null);
  const [threadVersion, setThreadVersion] = useState(0);

  useEffect(() => setDraft(null), [ticket.id]);

  async function changeStatus(status: Status) {
    setStatusBusy(true);
    try {
      onChange(await api.setStatus(username, ticket.id, status));
      toast.success("وضعیت بروزرسانی شد.");
    } catch (e) {
      toast.error("تغییر وضعیت ناموفق بود.", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <Card data-testid="ticket-detail">
      <CardHeader className="space-y-3">
        {onBack && (
          <Button variant="ghost" size="sm" className="w-fit lg:hidden" onClick={onBack}>
            <ArrowRight aria-hidden /> بازگشت به فهرست
          </Button>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <CardTitle dir="auto" className="break-words text-lg leading-8">{ticket.title}</CardTitle>
            <TicketMeta id={ticket.id} owner={ticket.owner} createdAt={ticket.created_at} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="status-select" className="text-xs text-muted-foreground">وضعیت</Label>
            <NativeSelect
              id="status-select"
              value={ticket.status}
              disabled={statusBusy}
              onChange={(e) => changeStatus(e.target.value as Status)}
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
            {statusBusy && <Loader2 className="size-4 animate-spin" aria-label="در حال ذخیره" />}
          </div>
        </div>
        <TicketBadges ticket={ticket} />
        {ticket.final_reply && (
          <p data-testid="final-reply-summary" className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden />
            پاسخ نهایی{ticket.replied_by ? ` توسط ${ticket.replied_by}` : ""}
            {ticket.replied_at ? ` در ${formatDate(ticket.replied_at)}` : ""} ارسال شده و در گفتگو مشخص است.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <section aria-label="متن تیکت" className="rounded-lg border bg-muted/30 p-3">
          <TicketBody text={ticket.body} className="text-sm" />
        </section>

        <Separator />

        <TicketThread
          username={username}
          ticketId={ticket.id}
          viewerRole="it"
          draft={draft}
          refreshKey={threadVersion}
          beforeComposer={
            <SuggestionPanel
              username={username}
              ticket={ticket}
              onChange={onChange}
              onUseInReply={(text) => setDraft({ text, nonce: Date.now() })}
              onSent={() => setThreadVersion((v) => v + 1)}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
