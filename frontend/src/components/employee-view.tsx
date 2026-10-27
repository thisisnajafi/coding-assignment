"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Loader2, Send, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlainText } from "@/components/plain-text";
import { TicketBadges } from "@/components/ticket-badges";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/labels";
import { useTickets } from "@/lib/use-tickets";
import type { Ticket } from "@/lib/types";

export function EmployeeView({ username }: { username: string }) {
  const { tickets, error, loading, reload, upsert } = useTickets(username);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <NewTicketForm username={username} onCreated={upsert} />
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">تیکت‌های من</h2>
          <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
            بروزرسانی
          </Button>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !tickets ? (
          <ListSkeleton />
        ) : tickets.length === 0 ? (
          <EmptyState text="هنوز تیکتی ثبت نکرده‌اید." />
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
    <Card data-testid="ticket-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle dir="auto" className="break-words">{ticket.title}</CardTitle>
          <span className="text-xs text-muted-foreground">#{ticket.id} · {formatDate(ticket.created_at)}</span>
        </div>
        <TicketBadges ticket={ticket} />
      </CardHeader>
      <CardContent className="space-y-3">
        <PlainText text={ticket.body} className="text-sm text-muted-foreground" />
        {ticket.final_reply ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:bg-emerald-950/30">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-emerald-800">
              <MessageSquareReply className="size-3.5" /> پاسخ پشتیبانی
            </div>
            <PlainText text={ticket.final_reply} className="text-sm" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">هنوز پاسخی ثبت نشده است.</p>
        )}
      </CardContent>
    </Card>
  );
}

function NewTicketForm({ username, onCreated }: { username: string; onCreated: (t: Ticket) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || body.trim().length < 5) {
      toast.error("عنوان حداقل ۳ و شرح مشکل حداقل ۵ نویسه باشد.");
      return;
    }
    setBusy(true);
    try {
      const t = await api.createTicket(username, { title: title.trim(), body: body.trim() });
      onCreated(t);
      setTitle("");
      setBody("");
      toast.success("تیکت با موفقیت ثبت شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت تیکت ناموفق بود.");
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
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">عنوان</Label>
            <Input id="title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: اینترنت قطع است" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">شرح مشکل</Label>
            <Textarea id="body" value={body} rows={6} maxLength={5000} onChange={(e) => setBody(e.target.value)} placeholder="جزئیات مشکل را بنویسید…" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />}
            ثبت تیکت
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
