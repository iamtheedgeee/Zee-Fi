function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    startDate: formatDate(start),
    endDate: formatDate(now),
  };
}

export function getCurrentWeekRange() {
  const now = new Date();

  const day = now.getDay(); // Sunday = 0
  const start = new Date(now);

  start.setDate(now.getDate() - day);

  return {
    startDate: formatDate(start),
    endDate: formatDate(now),
  };
}

export function getCurrentYearRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), 0, 1);

  return {
    startDate: formatDate(start),
    endDate: formatDate(now),
  };
}

export function getDaysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(`${endDate}T00:00:00`);
  end.setHours(0, 0, 0, 0);

  const difference = end.getTime() - today.getTime();

  return Math.max(0, Math.round(difference / (1000 * 60 * 60 * 24)));
}

type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

interface DateRange {
  startDate: string;
  endDate: string;
}

/*function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}*/

export function getPeriodRange(
  date: Date,
  period: BudgetPeriod
): DateRange {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case 'weekly': {
      const daysSinceMonday = (date.getDay() + 6) % 7;

      start.setDate(date.getDate() - daysSinceMonday);
      end.setDate(start.getDate() + 6);
      break;
    }

    case 'monthly': {
      start.setDate(1);
      end.setMonth(date.getMonth() + 1, 0);
      break;
    }

    case 'yearly': {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    }
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}