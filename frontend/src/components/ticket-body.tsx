"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSE_CHARS = 220;
const COLLAPSE_LINES = 4;

type Segment = { code: boolean; text: string };

/**
 * A line is "code-like" when it is mostly Latin/ASCII (pasted errors, logs, markup)
 * and has no Persian/Arabic letters. Such lines are shown LTR in a monospace block.
 */
export function isCodeLike(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^-{3,}$/.test(t)) return true;
  if (/[\u0600-\u06FF]/.test(t)) return false;
  return /[A-Za-z0-9]/.test(t);
}

export function splitSegments(text: string): Segment[] {
  const out: Segment[] = [];
  for (const line of text.split(/\r?\n/)) {
    const code = isCodeLike(line);
    const last = out[out.length - 1];
    if (last && last.code === code) last.text += "\n" + line;
    else out.push({ code, text: line });
  }
  return out.filter((s) => s.text.trim() !== "");
}

/**
 * Renders untrusted ticket text as plain React text (never HTML). Long bodies are
 * collapsed behind a "show more" toggle; code-like lines get a monospace LTR block.
 */
export function TicketBody({ text, className, collapsible = true }: { text: string; className?: string; collapsible?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const long = collapsible && (text.length > COLLAPSE_CHARS || text.split("\n").length > COLLAPSE_LINES);
  const collapsed = long && !open;

  return (
    <div className={cn("space-y-1", className)}>
      <div id={id} data-testid="ticket-body" className={cn("relative space-y-2", collapsed && "max-h-24 overflow-hidden")}>
        {splitSegments(text).map((s, i) =>
          s.code ? (
            <pre
              key={i}
              dir="ltr"
              className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border bg-muted px-3 py-2 text-start font-mono text-xs leading-relaxed text-muted-foreground"
            >
              {s.text}
            </pre>
          ) : (
            <p key={i} dir="auto" className="whitespace-pre-wrap break-words leading-7 [unicode-bidi:plaintext]">
              {s.text}
            </p>
          ),
        )}
        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" aria-hidden />
        )}
      </div>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? "نمایش کمتر" : "نمایش بیشتر"}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      )}
    </div>
  );
}
