export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

export function fmtKg(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value * 2) / 2;
  return `${rounded}`.replace('.', ',') + 'kg';
}

export function sessionId(dayId: string, dateISO: string): string {
  return `${dateISO}__${dayId}`;
}

export function youtubeSearchUrl(exerciseName: string): string {
  const query = `como hacer ${exerciseName} tecnica correcta`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function defaultDayForToday(): string {
  const weekday = new Date().getDay();
  if (weekday === 1) return 'lunes';
  if (weekday === 3) return 'miercoles';
  if (weekday === 5) return 'viernes';
  return 'lunes';
}
