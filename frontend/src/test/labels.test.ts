import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, label } from "@/lib/labels";

describe("label mapping", () => {
  it("maps API enums to Persian labels", () => {
    expect(label(STATUS_LABELS, "in_progress")).toBe("در حال بررسی");
    expect(label(CATEGORY_LABELS, "network")).toBe("شبکه");
    expect(label(PRIORITY_LABELS, "high")).toBe("زیاد");
  });

  it("falls back gracefully for unknown or missing values", () => {
    expect(label(STATUS_LABELS, "weird")).toBe("weird");
    expect(label(STATUS_LABELS, null)).toBe("نامشخص");
  });
});
