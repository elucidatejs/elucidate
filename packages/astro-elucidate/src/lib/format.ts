// Dates in front matter are calendar dates (UTC midnight), so format them in UTC.
const day = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const month = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** "Nov 11, 2026" */
export const formatDay = (date: Date): string => day.format(date);
/** "Nov 2026" */
export const formatMonth = (date: Date): string => month.format(date);
/** "2026-11-11" for datetime attributes. */
export const isoDay = (date: Date): string => date.toISOString().slice(0, 10);
