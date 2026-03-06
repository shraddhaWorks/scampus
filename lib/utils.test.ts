import { cn, formatDate, formatDateISO, formatDateTime, generateRefNumber } from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("joins class names and filters falsy", () => {
      expect(cn("a", "b")).toBe("a b");
      expect(cn("a", undefined, "b", null, false, "c")).toBe("a b c");
    });

    it("returns empty string when all falsy", () => {
      expect(cn(undefined, null, false)).toBe("");
    });
  });

  describe("formatDate", () => {
    it("formats Date object", () => {
      const d = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDate(d)).toMatch(/\d{2}\/\d{2}\/2024/);
    });

    it("formats ISO string", () => {
      expect(formatDate("2024-06-15T00:00:00.000Z")).toMatch(/\d{2}\/\d{2}\/2024/);
    });
  });

  describe("formatDateISO", () => {
    it("returns YYYY-MM-DD for Date", () => {
      const d = new Date("2024-03-10T12:00:00.000Z");
      expect(formatDateISO(d)).toBe("2024-03-10");
    });

    it("returns YYYY-MM-DD for string", () => {
      expect(formatDateISO("2024-05-20T00:00:00.000Z")).toBe("2024-05-20");
    });
  });

  describe("formatDateTime", () => {
    it("formats date and time", () => {
      const d = new Date(2024, 0, 15, 14, 30);
      const out = formatDateTime(d);
      expect(out).toMatch(/\d{2}\/\d{2}\/2024/);
      expect(out).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("generateRefNumber", () => {
    it("pads sequence to 3 digits", () => {
      expect(generateRefNumber("CIR", 2024, 1)).toBe("CIR/2024/001");
      expect(generateRefNumber("CIR", 2024, 99)).toBe("CIR/2024/099");
      expect(generateRefNumber("CIR", 2024, 100)).toBe("CIR/2024/100");
    });
  });
});
