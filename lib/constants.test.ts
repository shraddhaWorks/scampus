import {
  IMPORTANCE_LEVELS,
  CIRCULAR_RECIPIENTS,
  PUBLISH_STATUS,
  LEAVE_TYPES,
  LEAVE_STATUS,
  CIRCULAR_REF_PREFIX,
  EXAM_TERM_STATUS,
} from "@/lib/constants";

describe("lib/constants", () => {
  it("IMPORTANCE_LEVELS has expected values", () => {
    expect(IMPORTANCE_LEVELS).toEqual(["High", "Medium", "Low"]);
  });

  it("CIRCULAR_RECIPIENTS includes All, Teachers, Parents, Students, Staff", () => {
    const values = CIRCULAR_RECIPIENTS.map((r) => r.value);
    expect(values).toContain("All");
    expect(values).toContain("Teachers");
    expect(values).toContain("Parents");
    expect(values).toContain("Students");
    expect(values).toContain("Staff");
  });

  it("PUBLISH_STATUS has PUBLISHED and DRAFT", () => {
    expect(PUBLISH_STATUS.PUBLISHED).toBe("PUBLISHED");
    expect(PUBLISH_STATUS.DRAFT).toBe("DRAFT");
  });

  it("LEAVE_TYPES has expected values", () => {
    expect(LEAVE_TYPES).toContain("CASUAL");
    expect(LEAVE_TYPES).toContain("SICK");
    expect(LEAVE_TYPES).toContain("PAID");
    expect(LEAVE_TYPES).toContain("UNPAID");
  });

  it("LEAVE_STATUS has PENDING, APPROVED, REJECTED", () => {
    expect(LEAVE_STATUS).toEqual(["PENDING", "APPROVED", "REJECTED"]);
  });

  it("CIRCULAR_REF_PREFIX is CIR", () => {
    expect(CIRCULAR_REF_PREFIX).toBe("CIR");
  });

  it("EXAM_TERM_STATUS has UPCOMING and COMPLETED", () => {
    const values = EXAM_TERM_STATUS.map((s) => s.value);
    expect(values).toContain("UPCOMING");
    expect(values).toContain("COMPLETED");
  });
});
