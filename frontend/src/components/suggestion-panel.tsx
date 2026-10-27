"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PencilLine, RefreshCw, Send, Sparkles, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelPicker } from "@/components/model-picker";
import { PlainText } from "@/components/plain-text";
import { SourceBadge } from "@/components/ticket-badges";
import { SuggestionSkeleton } from "@/components/states";
import { api } from "@/lib/api";
import { DEFAULT_GROUPS, type ModelGroup } from "@/lib/models";
import type { Ticket } from "@/lib/types";

const DEFAULT_MODEL = "gpt-4o";
type Busy = null | "suggest" | "send" | "final";

/**
 * AI suggestion for the next IT reply (IT only). The suggestion is never sent automatically:
 * IT can copy it into the composer, send it as a thread message, or (once) as the final reply,
 * each after an explicit confirmation.
 */
export function SuggestionPanel({
  username,
  ticket,
  onChange,
  onUseInReply,
  onSent,
}: {
  username: string;
  ticket: Ticket;
  onChange: (t: Ticket) => void;
  onUseInReply: (text: string) => void;
  onSent: () => void;
}) {
  const [groups, setGroups] = useState<ModelGroup[]>(DEFAULT_GROUPS);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirm, setConfirm] = useState<null | "send" | "final">(null);
  // The suggestion text that has already been sent, so it is shown as "used".
  const [usedText, setUsedText] = useState<string | null>(null);
  const suggestion = ticket.suggested_reply || "";
  const replied = Boolean(ticket.final_reply);
  const used = Boolean(suggestion) && usedText === suggestion;

  useEffect(() => {
    api
      .models(username)
      .then(({ models: list, default: def, groups: g }) => {
        if (!list.length) return;
        setGroups(g);
        setModel(list.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : def && list.includes(def) ? def : list[0]);
      })
      .catch(() => {
        /* keep default model list */
      })
      .finally(() => setModelsLoading(false));
  }, [username]);

  useEffect(() => {
    setConfirm(null);
    setUsedText(null);
  }, [ticket.id]);

  async function regenerate() {
    setBusy("suggest");
    setConfirm(null);
    try {
      const t = await api.regenerate(username, ticket.id, model);
      onChange(t);
      toast.success(t.suggestion_source === "fallback" ? "سرویس AI در دسترس نبود؛ پاسخ جایگزین تولید شد." : "پیشنهاد جدید تولید شد.");
    } catch (e) {
      toast.error("تولید پیشنهاد ناموفق بود.", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  async function send(kind: "send" | "final") {
    setBusy(kind);
    try {
      if (kind === "final") onChange(await api.reply(username, ticket.id, suggestion));
      else await api.postMessage(username, ticket.id, suggestion);
      setUsedText(suggestion);
      onSent();
      toast.success(kind === "final" ? "پاسخ نهایی ارسال شد." : "پیشنهاد به‌عنوان پیام ارسال شد.");
    } catch (e) {
      toast.error("ارسال ناموفق بود.", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  return (
    <section data-testid="suggestion-panel" aria-label="پیشنهاد پاسخ هوش مصنوعی" className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600" aria-hidden />
          <span className="text-sm font-medium">پیشنهاد پاسخ بعدی</span>
          {ticket.suggestion_source && <SourceBadge source={ticket.suggestion_source} />}
          {used && (
            <span data-testid="suggestion-used" className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" aria-hidden /> استفاده شد
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModelPicker groups={groups} value={model} onChange={setModel} loading={modelsLoading} disabled={busy !== null} />
          <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}>
            {busy === "suggest" ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            تولید مجدد
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-background/80 p-3">
        {busy === "suggest" ? (
          <SuggestionSkeleton />
        ) : suggestion ? (
          <PlainText text={suggestion} className="text-sm leading-7" />
        ) : (
          <p className="text-sm text-muted-foreground">پیشنهادی وجود ندارد؛ «تولید مجدد» را بزنید.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        {ticket.suggestion_source === "fallback" && <span>این متن توسط قواعد پیش‌فرض (بدون هوش مصنوعی) تولید شده است.</span>}
        {ticket.suggestion_model && (
          <span>
            مدل: <span dir="ltr">{ticket.suggestion_model}</span>
          </span>
        )}
        {ticket.suggestion_note && <PlainText text={ticket.suggestion_note} className="inline" />}
      </div>

      {suggestion && busy !== "suggest" && (
        confirm ? (
          <div role="alertdialog" aria-label="تأیید ارسال" className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/30">
            <span className="flex-1">
              {confirm === "final"
                ? "این متن به‌عنوان پاسخ نهایی برای کاربر ارسال می‌شود و قابل ویرایش نیست. ادامه می‌دهید؟"
                : "این متن بدون ویرایش در گفتگو برای کاربر ارسال می‌شود. ادامه می‌دهید؟"}
            </span>
            <Button size="sm" onClick={() => send(confirm)} disabled={busy !== null}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              بله، ارسال شود
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(null)} disabled={busy !== null}>
              انصراف
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onUseInReply(suggestion)} disabled={busy !== null}>
              <PencilLine aria-hidden /> استفاده در پاسخ
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirm("send")} disabled={busy !== null}>
              <Send aria-hidden /> ارسال در گفتگو
            </Button>
            {!replied && (
              <Button size="sm" onClick={() => setConfirm("final")} disabled={busy !== null}>
                <Stamp aria-hidden /> ارسال به‌عنوان پاسخ نهایی
              </Button>
            )}
          </div>
        )
      )}
    </section>
  );
}
