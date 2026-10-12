export function toTitleCase(str:string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
export function formatCurrency(amount: number | string, currency:string|false="₦"): string {
  return `${currency? currency: ''}${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats an ISO date-time string into a readable time.
 *
 * Examples:
 *   formatTime("2024-08-14T09:41:00") → "09:41 AM"
 */
export function formatTime(isoString: string): string {
  console.log(isoString)
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats an ISO date string into a short readable date.
 *
 * Examples:
 *   formatDate("2024-08-14T09:41:00") → "Aug 14, 2024"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats an ISO date string into a human-friendly
 * group header label for the transaction history list.
 *
 * Examples:
 *   "2024-08-14T09:41:00" on Aug 14 → "Today"
 *   "2024-08-13T09:41:00" on Aug 14 → "Yesterday"
 *   "2024-08-11T09:41:00" on Aug 14 → "August 11, 2024"
 */
export function formatDateGroupHeader(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-NG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Groups an array of transactions by their date
 * for the transaction history grouped list view.
 *
 * Returns an array of { dateLabel, transactions } objects
 * sorted with the most recent date first.
 */
export function groupTransactionsByDate<T extends { date: string }>(
  transactions: T[]
): { dateLabel: string; transactions: T[] }[] {
  const sortedTransactions=[...transactions].sort((a, b) => {
    return Date.parse(b.date) - Date.parse(a.date);
  })
  const groups: Record<string, T[]> = {};

  for (const transaction of sortedTransactions) {
    const label = formatDateGroupHeader(transaction.date);

    if (!groups[label]) {
      groups[label] = [];
    }

    groups[label].push(transaction);
  }

  /**
   * Convert the groups object into an array.
   * The order follows insertion order which matches
   * the reverse-chronological order of mockTransactions.
   */
  return Object.entries(groups).map(([dateLabel, transactions]) => ({
    dateLabel,
    transactions,
  }));
}