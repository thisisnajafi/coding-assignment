"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Clock, Inbox, Loader2, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FinalReply } from "@/components/final-reply";
import { TicketBadges } from "@/components/ticket-badges";
import { TicketBody } from "@/components/ticket-body";
import { TicketMeta } from "@/components/ticket-meta";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { api } from "@/lib/api";
import { useTickets } from "@/lib/use-tickets";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const BODY_MIN = 5;
const BODY_MAX = 5000;

export function EmployeeView({ username }: { username: string }) {
  const { tickets, error, loading, reload, upsert } = useTickets(username);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <NewTicketForm username={username} onCreated={upsert} />
      <section className="space-y-3" aria-labelledby="my-tickets">
        <div className="flex items-center justify-between">
          <h2 id="my-tickets" className="text-lg font-bold">
            تیکت‌های من
            {tickets && tickets.length > 0 && (
              <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {tickets.length.toLocaleString("fa-IR")}
              </span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={reload} disabled={loading} aria-label="بروزرسانی فهرست تیکت‌ها">
            <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
            بروزرسانی
          </Button>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !tickets ? (
          <ListSkeleton rows={3} />
        ) : tickets.length === 0 ? (
          <EmptyState icon={Inbox} text="هنوز تیکتی ثبت نکرده‌اید." hint="از فرم «ثبت تیکت جدید» مشکل خود را گزارش دهید." />
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {tickets.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <EmployeeTicketCard ticket={t} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}

function EmployeeTicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Card data-testid="ticket-card" className="transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <CardTitle dir="auto" className="break-words text-base leading-7">
          {ticket.title}
        </CardTitle>
        <TicketMeta id={ticket.id} createdAt={ticket.created_at} />
        <TicketBadges ticket={ticket} />
      </CardHeader>
      <CardContent className="space-y-3">
        <TicketBody text={ticket.body} className="text-sm text-muted-foreground" />
        {ticket.final_reply ? (
          <FinalReply text={ticket.final_reply} repliedAt={ticket.replied_at} />
        ) : (
          <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            هنوز پاسخی ثبت نشده است؛ کارشناس به‌زودی بررسی می‌کند.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function validateTicket(title: string, body: string): { title?: string; body?: string } {
  const errors: { title?: string; body?: string } = {};
  if (title.trim().length < TITLE_MIN) errors.title = `عنوان باید حداقل ${TITLE_MIN.toLocaleString("fa-IR")} نویسه باشد.`;
  if (body.trim().length < BODY_MIN) errors.body = `شرح مشکل باید حداقل ${BODY_MIN.toLocaleString("fa-IR")} نویسه باشد.`;
  return errors;
}

function NewTicketForm({ username, onCreated }: { username: string; onCreated: (t: Ticket) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const errors = validateTicket(title, body);
  const show = (k: "title" | "body") => (touched ? errors[k] : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (errors.title || errors.body) {
      toast.error("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }
    setBusy(true);
    try {
      const t = await api.createTicket(username, { title: title.trim(), body: body.trim() });
      onCreated(t);
      setTitle("");
      setBody("");
      setTouched(false);
      toast.success("تیکت با موفقیت ثبت شد.", { description: `شماره تیکت: ${t.id.toLocaleString("fa-IR")}` });
    } catch (err) {
      toast.error("ثبت تیکت ناموفق بود.", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle>ثبت تیکت جدید</CardTitle>
        <CardDescription>مشکل خود را شرح دهید؛ دسته‌بندی و اولویت به‌صورت خودکار تعیین می‌شود.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-4" aria-busy={busy}>
          <div className="space-y-1.5">
            <Label htmlFor="title">عنوان</Label>
            <Input
              id="title"
              value={title}
              maxLength={TITLE_MAX}
              disabled={busy}
              aria-invalid={Boolean(show("title"))}
              aria-describedby={show("title") ? "title-error" : undefined}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: اینترنت قطع است"
            />
            {show("title") && (
              <p id="title-error" role="alert" className="text-xs text-destructive">
                {show("title")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">شرح مشکل</Label>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {body.length.toLocaleString("fa-IR")} / {BODY_MAX.toLocaleString("fa-IR")}
              </span>
            </div>
            <Textarea
              id="body"
              value={body}
              rows={6}
              maxLength={BODY_MAX}
              disabled={busy}
              aria-invalid={Boolean(show("body"))}
              aria-describedby={show("body") ? "body-error" : "body-hint"}
              onChange={(e) => setBody(e.target.value)}
              placeholder="جزئیات مشکل را بنویسید…"
            />
            {show("body") ? (
              <p id="body-error" role="alert" className="text-xs text-destructive">
                {show("body")}
              </p>
            ) : (
              <p id="body-hint" className="text-xs text-muted-foreground">
                رمز عبور خود را در تیکت ننویسید؛ رمزها به‌صورت خودکار پنهان می‌شوند.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {busy ? "در حال ثبت و تحلیل…" : "ثبت تیکت"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
