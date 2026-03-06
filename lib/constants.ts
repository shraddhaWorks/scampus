/**
 * App-wide constants
 */

export const IMPORTANCE_LEVELS = ["High", "Medium", "Low"] as const;
export type ImportanceLevel = (typeof IMPORTANCE_LEVELS)[number];

export const CIRCULAR_RECIPIENTS = [
  { value: "All", label: "All" },
  { value: "Teachers", label: "Teachers" },
  { value: "Parents", label: "Parents" },
  { value: "Students", label: "Students" },
  { value: "Staff", label: "Staff" },
] as const;

export const PUBLISH_STATUS = {
  PUBLISHED: "PUBLISHED",
  DRAFT: "DRAFT",
} as const;

export const LEAVE_TYPES = ["CASUAL", "SICK", "PAID", "UNPAID"] as const;
export const LEAVE_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;

export const CIRCULAR_REF_PREFIX = "CIR";

export const EXAM_TERM_STATUS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "COMPLETED", label: "Completed" },
] as const;
