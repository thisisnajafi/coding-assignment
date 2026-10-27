import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home } from "@/components/home";
import { DEMO_USERS, UserProvider } from "@/lib/user-context";
import type { Ticket } from "@/lib/types";

const tickets: Ticket[] = [
  {
    id: 1,
    owner: "maryam",
    title: "XSS ticket",
    body: '<img src=x onerror="alert(1)">',
    category: "software",
    priority: "medium",
    status: "open",
    suggested_reply: "Try restarting",
    suggestion_source: "fallback",
    final_reply: null,
    created_at: "2026-10-27T10:00:00Z",
  },
  {
    id: 2,
    owner: "hossein",
    title: "VPN down",
    body: "VPN not connecting",
    category: "network",
    priority: "high",
    status: "in_progress",
    suggested_reply: null,
    suggestion_source: "ai",
    final_reply: null,
    created_at: "2026-10-27T11:00:00Z",
  },
];

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const user = new Headers(init?.headers).get("X-User");
    let data: unknown = [];
    if (url.endsWith("/api/tickets")) data = user === "it_admin" ? tickets : tickets.filter((t) => t.owner === user);
    else if (url.endsWith("/api/ai/models")) data = { models: ["gpt-4o", "gpt-4o-mini"], default: "gpt-4o" };
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  });
}

describe("role-based views", () => {
  let fetchMock: ReturnType<typeof mockFetch>;
  beforeEach(() => {
    fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the employee form and only own tickets, sending X-User", async () => {
    window.localStorage.setItem("demo-user", "maryam");
    render(
      <UserProvider initialUsers={DEMO_USERS}>
        <Home />
      </UserProvider>,
    );
    expect(await screen.findByText("ثبت تیکت جدید")).toBeInTheDocument();
    expect(await screen.findByText("XSS ticket")).toBeInTheDocument();
    expect(screen.queryByText("VPN down")).not.toBeInTheDocument();
    expect(document.querySelector("main img")).toBeNull();
    const call = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/api/tickets"));
    expect(new Headers(call![1]!.headers).get("X-User")).toBe("maryam");
  });

  it("switches to the IT dashboard and shows the AI source badge", async () => {
    window.localStorage.setItem("demo-user", "maryam");
    render(
      <UserProvider initialUsers={DEMO_USERS}>
        <Home />
      </UserProvider>,
    );
    await screen.findByText("ثبت تیکت جدید");
    await userEvent.selectOptions(screen.getByLabelText("انتخاب کاربر"), "it_admin");
    expect(window.localStorage.getItem("demo-user")).toBe("it_admin");
    expect(await screen.findByText("داشبورد پشتیبانی IT")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId("it-ticket-row")).toHaveLength(2));
    expect(screen.queryByText("ثبت تیکت جدید")).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByTestId("it-ticket-row").find((r) => within(r).queryByText("XSS ticket"))!);
    expect(await screen.findByTestId("source-badge")).toHaveTextContent("پاسخ جایگزین");
    expect(document.querySelector("main img")).toBeNull();
  });
});
