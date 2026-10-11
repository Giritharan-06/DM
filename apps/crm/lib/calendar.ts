export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from(
    { length: 42 },
    (_, i) =>
      new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, 12),
  );
}
export function calendarRange(month: Date) {
  const days = calendarDays(month);
  const from = new Date(
    days[0].getFullYear(),
    days[0].getMonth(),
    days[0].getDate(),
  );
  const last = days[41];
  const to = new Date(
    last.getFullYear(),
    last.getMonth(),
    last.getDate(),
    23,
    59,
    59,
    999,
  );
  return { from: from.toISOString(), to: to.toISOString() };
}
export function localDateTime(date: Date, hour = 10) {
  return `${localDate(date)}T${String(hour).padStart(2, "0")}:00`;
}
