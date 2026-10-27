import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlainText } from "@/components/plain-text";

const XSS = 'خطا: <img src=x onerror="alert(document.cookie)"> لطفا بررسی کنید';

describe("PlainText", () => {
  it("renders ticket text escaped, never as HTML", () => {
    const { container } = render(<PlainText text={XSS} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(XSS, { exact: true })).toBeInTheDocument();
    expect(container.innerHTML).toContain("&lt;img");
  });
});
