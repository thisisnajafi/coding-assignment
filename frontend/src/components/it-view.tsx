"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Inbox, Loader2, MousePointerClick, RefreshCw, Search, SearchX, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import { PlainText } from "@/components/plain-text";
import { FinalReply } from "@/components/final-reply";
import { TicketBody } from "@/components/ticket-body";
import { TicketMeta } from "@/components/ticket-meta";
import { SourceBadge, TicketBadges } from "@/components/ticket-badges";
import { EmptyState, ErrorState, DetailSkeleton, ListSkeleton, SuggestionSkeleton } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { useTickets } from "@/lib/use-tickets";
import { cn } from "@/lib/utils";
import type { Status, Ticket } from "@/lib/types";

const DEFAULT_MODEL = "gpt-4o";

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
  const [models, setModels] = useState<string[]>([DEFAULT_MODEL]);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [reply, setReply] = useState(ticket.final_reply || ticket.suggested_reply || "");
  const [busy, setBusy] = useState<null | "status" | "suggest" | "reply">(null);
  const replied = Boolean(ticket.final_reply);

  useEffect(() => {
    api
      .models(username)
      .then(({ models: list, default: def }) => {
        if (!list.length) return;
        setModels(list);
        setModel(list.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : def && list.includes(def) ? def : list[0]);
      })
      .catch(() => {
        /* keep default model list */
      })
      .finally(() => setModelsLoading(false));
  }, [username]);

  useEffect(() => {
    setReply(ticket.final_reply || ticket.suggested_reply || "");
    // Reset the draft only when switching tickets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  async function run<T>(kind: "status" | "suggest" | "reply", fn: () => Promise<T>, ok: string) {
    setBusy(kind);
    try {
      const t = await fn();
      if (t && typeof t === "object" && "id" in t) onChange(t as unknown as Ticket);
      else onChange(await api.getTicket(username, ticket.id));
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error("عملیات ناموفق بود.", { description: e instanceof Error ? e.message : undefined });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function regenerate() {
    setBusy("suggest");
    try {
      const t = await api.regenerate(username, ticket.id, model);
      onChange(t);
      if (!replied) setReply(t.suggested_reply || "");
      toast.success(t.suggestion_source === "fallback" ? "سرویس AI در دسترس نبود؛ پاسخ جایگزین تولید شد." : "پیشنهاد جدید تولید شد.");
    } catch (e) {
      toast.error("تولید پیشنهاد ناموفق بود.", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        {onBack && (
          <Button variant="ghost" size="sm" className="w-fit lg:hidden" onClick={onBack}>
            <ArrowRight /> بازگشت به فهرست
          </Button>
        )}
        <CardTitle dir="auto" className="break-words text-lg leading-8">{ticket.title}</CardTitle>
        <TicketMeta id={ticket.id} owner={ticket.owner} createdAt={ticket.created_at} />
        <TicketBadges ticket={ticket} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg bg-muted/40 p-3">
          <TicketBody text={ticket.body} className="text-sm" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="status-select">تغییر وضعیت:</Label>
          <NativeSelect
            id="status-select"
            value={ticket.status}
            disabled={busy !== null}
            onChange={(e) =>
              run("status", () => api.setStatus(username, ticket.id, e.target.value as Status), "وضعیت بروزرسانی شد.")
            }
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
          {busy === "status" && <Loader2 className="size-4 animate-spin" />}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <span className="font-medium">پیشنهاد پاسخ</span>
              {ticket.suggestion_source && <SourceBadge source={ticket.suggestion_source} />}
            </div>
            <div className="flex items-center gap-2">
              {modelsLoading ? (
                <Skeleton data-testid="model-picker-skeleton" className="h-9 w-32 rounded-lg" />
              ) : (
                <NativeSelect
                  aria-label="انتخاب مدل هوش مصنوعی"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={busy !== null}
                  dir="ltr"
                  className="max-w-40"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </NativeSelect>
              )}
              <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}>
                {busy === "suggest" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                تولید مجدد
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 dark:bg-violet-950/20">
            {busy === "suggest" ? (
              <SuggestionSkeleton />
            ) : ticket.suggested_reply ? (
              <PlainText text={ticket.suggested_reply} className="text-sm" />
            ) : (
              <p className="text-sm text-muted-foreground">پیشنهادی وجود ندارد.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {ticket.suggestion_source === "fallback" && (
              <span>این متن توسط قواعد پیش‌فرض (بدون هوش مصنوعی) تولید شده است.</span>
            )}
            {ticket.suggestion_model && (
              <span>
                مدل: <span dir="ltr">{ticket.suggestion_model}</span>
              </span>
            )}
            {ticket.suggestion_note && <PlainText text={ticket.suggestion_note} className="inline" />}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="final-reply">پاسخ نهایی</Label>
          {replied ? (
            <FinalReply
              text={ticket.final_reply || ""}
              repliedAt={ticket.replied_at}
              repliedBy={ticket.replied_by}
              note="پاسخ نهایی ارسال شده و قابل ویرایش نیست."
            />
          ) : (
            <>
              <Textarea id="final-reply" rows={6} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پاسخ نهایی را بنویسید یا پیشنهاد را ویرایش کنید…" />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy !== null || reply.trim().length < 2}
                  onClick={() => run("reply", () => api.reply(username, ticket.id, reply.trim()), "پاسخ نهایی ارسال شد.")}
                >
                  {busy === "reply" ? <Loader2 className="animate-spin" /> : <Send />}
                  ارسال پاسخ نهایی
                </Button>
                {ticket.suggested_reply && (
                  <Button variant="ghost" onClick={() => setReply(ticket.suggested_reply || "")}>
                    استفاده از پیشنهاد
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
