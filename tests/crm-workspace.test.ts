import { describe, it, expect } from "vitest";
import {
  calendarDays,
  calendarRange,
  localDate,
  localDateTime,
} from "../apps/crm/lib/calendar";
import { agencyProfileSchema } from "@zyroz/validation";
describe("CRM calendar", () => {
  it("covers a leap month with six complete Monday-first weeks", () => {
    const days = calendarDays(new Date(2024, 1, 15));
    expect(days).toHaveLength(42);
    expect(days[0].getDay()).toBe(1);
    expect(days[41].getDay()).toBe(0);
    expect(days.some((d) => localDate(d) === "2024-02-29")).toBe(true);
    expect(new Set(days.map(localDate)).size).toBe(42);
  });
  it("spans year boundaries and includes the full final day", () => {
    const month = new Date(2026, 11, 1);
    const days = calendarDays(month),
      range = calendarRange(month);
    const start = new Date(range.from),
      end = new Date(range.to);
    expect(localDate(start)).toBe(localDate(days[0]));
    expect(start.getHours()).toBe(0);
    expect(localDate(end)).toBe(localDate(days[41]));
    expect(end.getHours()).toBe(23);
    expect(end.getMilliseconds()).toBe(999);
  });
  it("keeps local scheduling dates without UTC truncation", () => {
    expect(localDateTime(new Date(2026, 9, 10), 10)).toBe("2026-10-10T10:00");
  });
});
describe("Agency profile validation", () => {
  it("accepts optional contact details and a valid brand color", () => {
    expect(agencyProfileSchema.parse({ name: "ZYROZ Agency" }).brandColor).toBe(
      "#6c4dff",
    );
    expect(
      agencyProfileSchema.safeParse({
        name: "Agency",
        email: "team@example.com",
        brandColor: "#123ABC",
      }).success,
    ).toBe(true);
  });
  it("rejects invalid email, color and empty identity", () => {
    for (const input of [
      { name: "" },
      { name: "Agency", email: "invalid" },
      { name: "Agency", brandColor: "url(javascript:alert(1))" },
      { name: "Agency", gstin: "invalid" },
    ])
      expect(agencyProfileSchema.safeParse(input).success).toBe(false);
  });
});
