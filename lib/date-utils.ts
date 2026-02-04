/**
 * Date formatting utilities
 */

/**
 * Format date as "Jan 15, 2024"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format time as "3:30 pm"
 */
export function formatTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

/**
 * Format date as "2024.01.15"
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Format date range as "Jan 15, 3:30 PM - 5:00 PM" or spans days
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate) return "TBD";

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const startFormatted = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const startTime = start
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  if (!end) {
    return `${startFormatted}, ${startTime}`;
  }

  const endTime = end
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  // Check if same day
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${startFormatted}, ${startTime} - ${endTime}`;
  }

  const endFormatted = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Parse ISO date string into date and time parts
 */
export function parseDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "", time: "" };
  const dateObj = new Date(isoString);
  const date = dateObj.toISOString().split("T")[0];
  const time = dateObj.toTimeString().slice(0, 5);
  return { date, time };
}

/**
 * Combine date and time strings into ISO string
 */
export function combineDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  if (!time) {
    // If no time specified, use start of day
    return new Date(date).toISOString();
  }
  const combined = new Date(`${date}T${time}`);
  return combined.toISOString();
}

/**
 * Check if a date has passed based on GMT+8 (Asia/Shanghai) timezone
 * Returns true if the given date is in the past
 */
export function isEventPastDeadline(endDateString: string | null | undefined): boolean {
  if (!endDateString) return false;
  
  // Get current time in GMT+8
  const now = new Date();
  const nowInGMT8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  
  // Parse the end date and convert to GMT+8
  const endDate = new Date(endDateString);
  const endDateInGMT8 = new Date(endDate.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  
  return nowInGMT8 > endDateInGMT8;
}

/**
 * Get current time in GMT+8 timezone as Date object
 */
export function getNowInGMT8(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
}
