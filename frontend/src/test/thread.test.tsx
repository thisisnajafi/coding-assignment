import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketThread } from "@/components/ticket-thread";
import type { Message } from "@/lib/types";

const msgs: Message[] = [
  { id: 1, ticket_id: 7, author: "maryam", role: "employee", body: "<b>hi</b> مشکل دارم", reply_to_id: null, reply_to: null, is_final: false, created_at: "2026-10-27T10:00:00Z" },
  { id: 2, ticket_id: 7, author: "it_admin", role: "it", body: "ریستارت کنید", reply_to_id: 1, reply_to: { id: 1, author: "maryam", role: "employee", snippet: "مشکل دارم" }, is_final: false, created_at: "2026-10-27T10:05:00Z" },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("TicketThread", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a skeleton while loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<TicketThread username="maryam" ticketId={7} viewerRole="employee" />);
    expect(screen.getByTestId("thread-skeleton")).toBeInTheDocument();
  });

  it("renders messages as text with quoted parent and posts a reply-to", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        return json({ ...msgs[0], id: 3, body: body.body, reply_to_id: body.reply_to_id, reply_to: null }, 201);
      }
      return json(msgs);
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<TicketThread username="maryam" ticketId={7} viewerRole="employee" />);
    await waitFor(() => expect(screen.getAllByTestId("thread-message")).toHaveLength(2));
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByTestId("quoted-parent")).toHaveTextContent("مشکل دارم");

    await userEvent.click(screen.getByRole("button", { name: "پاسخ به پیام it_admin" }));
    expect(screen.getByTestId("reply-chip")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("متن پیام"), "انجام دادم");
    await userEvent.click(screen.getByRole("button", { name: /ارسال پیام/ }));
    await waitFor(() => expect(screen.getAllByTestId("thread-message")).toHaveLength(3));
    const post = fetchMock.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(String(post[0])).toContain("/api/tickets/7/messages");
    expect(JSON.parse(String(post[1]!.body))).toEqual({ body: "انجام دادم", reply_to_id: 2 });
    expect(new Headers(post[1]!.headers).get("X-User")).toBe("maryam");
  });
});
