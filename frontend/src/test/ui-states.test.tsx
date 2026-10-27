import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home } from "@/components/home";
import { TicketBody, isCodeLike } from "@/components/ticket-body";
import { validateTicket } from "@/components/employee-view";
import { DEMO_USERS, UserProvider } from "@/lib/user-context";

function renderHome() {
  return render(
    <UserProvider initialUsers={DEMO_USERS}>
      <Home />
    </UserProvider>,
  );
}

describe("loading and empty states", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows layout-matched skeletons while tickets are loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {}))); // never resolves
    window.localStorage.setItem("demo-user", "maryam");
    renderHome();
    expect(await screen.findByTestId("list-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("ticket-card-skeleton")).toHaveLength(3);
  });

  it("shows row and detail skeletons for IT while loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    window.localStorage.setItem("demo-user", "it_admin");
    renderHome();
    expect(await screen.findByTestId("detail-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("ticket-row-skeleton").length).toBeGreaterThan(0);
  });

  it("shows an empty state when the employee has no tickets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })),
    );
    window.localStorage.setItem("demo-user", "maryam");
    renderHome();
    expect(await screen.findByTestId("empty-state")).toHaveTextContent("هنوز تیکتی ثبت نکرده‌اید.");
    expect(screen.queryByTestId("list-skeleton")).not.toBeInTheDocument();
  });
});

describe("TicketBody", () => {
  it("collapses long text and expands on demand", async () => {
    render(<TicketBody text={"خط طولانی ".repeat(100)} />);
    const toggle = screen.getByRole("button", { name: /نمایش بیشتر/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: /نمایش کمتر/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("puts pasted English error lines in an LTR monospace block, as text only", () => {
    const { container } = render(<TicketBody text={"ایمیلم باز نمی‌شود:\nOutlook error 0x800CCC0E.\n<img src=x onerror=alert(1)>"} />);
    const pre = container.querySelector("pre");
    expect(pre).toHaveAttribute("dir", "ltr");
    expect(pre).toHaveTextContent("Outlook error 0x800CCC0E.");
    expect(container.querySelector("img")).toBeNull();
    expect(isCodeLike("ایمیل Outlook")).toBe(false);
    expect(screen.queryByRole("button", { name: /نمایش بیشتر/ })).toBeNull(); // short text is not collapsed
  });
});

describe("form validation", () => {
  it("reports short title and body", () => {
    expect(validateTicket("ab", "x")).toEqual({ title: expect.any(String), body: expect.any(String) });
    expect(validateTicket("عنوان", "شرح کامل")).toEqual({});
  });
});
