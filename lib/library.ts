/**
 * Library helpers (fines, etc.)
 */

export function calculateFine(params: {
  expectedDate: Date;
  finePerDay: number;
  returnDate?: Date | null;
}): { overdueDays: number; fineAmount: number } {
  const { expectedDate, finePerDay, returnDate } = params;
  const end = returnDate ? new Date(returnDate) : new Date();
  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - expected.getTime();
  const overdueDays = diffMs <= 0 ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const fineAmount = Math.max(0, overdueDays * (Number(finePerDay) || 0));

  return { overdueDays, fineAmount };
}
