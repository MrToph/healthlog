const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const oneDayMs = 24 * 60 * 60 * 1000;

export type DateRangeInput = {
  from?: string;
  to?: string;
};

export type DateRange = {
  from: string | null;
  to: string | null;
  startedAtFromMs: number | null;
  startedAtBeforeMs: number | null;
};

export function parseDateRange(input: DateRangeInput): DateRange {
  const from = input.from ? parseCalendarDate(input.from, "from") : null;
  const to = input.to ? parseCalendarDate(input.to, "to") : null;

  if (from && to && from.utcStartMs > to.utcStartMs) {
    throw new Error("--from must be before or equal to --to");
  }

  // Expand date filters around UTC midnight so local-time workouts near the
  // boundary are included instead of accidentally excluded.
  return {
    from: from?.value ?? null,
    to: to?.value ?? null,
    startedAtFromMs: from ? from.utcStartMs - oneDayMs : null,
    startedAtBeforeMs: to ? to.utcStartMs + 2 * oneDayMs : null,
  };
}

function parseCalendarDate(
  value: string,
  label: string,
): { value: string; utcStartMs: number } {
  if (!datePattern.test(value)) {
    throw new Error(`Invalid --${label} date "${value}". Expected YYYY-MM-DD.`);
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcStartMs = Date.UTC(year, month - 1, day);
  const parsed = new Date(utcStartMs);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(
      `Invalid --${label} date "${value}". Expected a real calendar date.`,
    );
  }

  return { value, utcStartMs };
}
