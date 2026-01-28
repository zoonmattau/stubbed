/**
 * Parse a date string as local time to avoid timezone offset issues.
 * new Date("2024-01-15") parses as UTC midnight, which can shift the date
 * by a day depending on the user's timezone. This function ensures dates
 * are always interpreted in the user's local timezone.
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();

  // If it's a full ISO timestamp with time, parse normally
  if (dateString.includes('T') || dateString.includes(' ')) {
    return new Date(dateString);
  }

  // For date-only strings (YYYY-MM-DD), parse as local time
  const [year, month, day] = dateString.split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  // Fallback for other formats
  return new Date(dateString);
}

export function formatDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes}${ampm}`;
}

export function formatDateTime(dateString: string, timeString: string | null): string {
  const formattedDate = formatDate(dateString);
  if (!timeString) return formattedDate;
  return `${formattedDate} at ${formatTime(timeString)}`;
}

export function getRelativeTime(dateString: string): string {
  const date = parseLocalDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatRelativeTime(dateString: string): string {
  const date = parseLocalDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return formatDate(dateString);
}

export function isToday(dateString: string): boolean {
  const date = parseLocalDate(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isFutureDate(dateString: string): boolean {
  const date = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

export function getMonthYear(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export function getYear(dateString: string): number {
  return parseLocalDate(dateString).getFullYear();
}

export function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Australian sports seasons typically run Feb-Oct (winter sports) or Oct-Mar (summer sports)
  // Default to current year for simplicity
  return year.toString();
}

export function getDayOfWeek(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-AU', { weekday: 'long' });
}

export function sortByDate<T extends { event_date?: string; created_at?: string }>(
  items: T[],
  ascending = false
): T[] {
  return [...items].sort((a, b) => {
    const dateA = parseLocalDate(a.event_date || a.created_at || '');
    const dateB = parseLocalDate(b.event_date || b.created_at || '');
    return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });
}

/**
 * Format a date for display with custom options, ensuring local timezone.
 */
export function formatDateCustom(
  dateString: string,
  options: Intl.DateTimeFormatOptions
): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-AU', options);
}
