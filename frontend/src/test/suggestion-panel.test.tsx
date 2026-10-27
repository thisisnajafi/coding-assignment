import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionPanel } from "@/components/suggestion-panel";
import type { Ticket } from "@/lib/types";

const base: Ticket = {
  id: 6, owner: "hossein", title: "مشکل ایمیل", body: "x", category: "software", priority: "medium",
  status: "open", suggested_reply: "سلام، لطفاً Outlook را ریستارت کنید.", suggestion_source: "ai",
  suggestion_model: "gpt-4o", final_reply: null, created_at: "2026-10-27T10:00:00Z",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function setup(ticket: Ticket) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/api/ai/models")) return json({ default: "gpt-4o", models: ["gpt-4o"], groups: [{ provider: "openai", label: "OpenAI", models: ["gpt-4o"] }] });
    if (url.endsWith("/messages") && init?.method === "POST") return json({ id: 9 }, 201);
    if (url.endsWith("/reply")) return json({ ...ticket, final_reply: JSON.parse(String(init!.body)).reply });
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  const props = { onChange: vi.fn(), onUseInReply: vi.fn(), onSent: vi.fn() };
  render(<SuggestionPanel username="it_admin" ticket={ticket} {...props} />);
  return { fetchMock, ...props };
}

describe("SuggestionPanel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("copies the suggestion into the composer", async () => {
    const { onUseInReply } = setup(base);
    await userEvent.click(screen.getByRole("button", { name: /استفاده در پاسخ/ }));
    expect(onUseInReply).toHaveBeenCalledWith(base.suggested_reply);
  });

  it("sends the suggestion as a thread message only after confirmation, then marks it used", async () => {
    const { fetchMock, onSent } = setup(base);
    await userEvent.click(screen.getByRole("button", { name: /ارسال در گفتگو/ }));
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: /بله، ارسال شود/ }));
    await waitFor(() => expect(onSent).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find(([u, i]) => String(u).endsWith("/api/tickets/6/messages") && i?.method === "POST")!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ body: base.suggested_reply, reply_to_id: null });
    expect(await screen.findByTestId("suggestion-used")).toBeInTheDocument();
  });

  it("offers 'send as final reply' only before a final reply exists", async () => {
    const { fetchMock, onChange } = setup(base);
    await userEvent.click(screen.getByRole("button", { name: /ارسال به‌عنوان پاسخ نهایی/ }));
    await userEvent.click(screen.getByRole("button", { name: /بله، ارسال شود/ }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith("/api/tickets/6/reply"))).toBe(true);
  });

  it("hides the final-reply action once replied, but still allows sending in the thread", () => {
    setup({ ...base, final_reply: "قبلاً پاسخ داده شد" });
    expect(screen.queryByRole("button", { name: /ارسال به‌عنوان پاسخ نهایی/ })).toBeNull();
    expect(screen.getByRole("button", { name: /ارسال در گفتگو/ })).toBeInTheDocument();
  });
});
