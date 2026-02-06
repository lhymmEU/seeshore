// ============================================
// PERSISTENT SESSION MANAGEMENT
// Sessions last for 7 days. Users won't need to
// re-login unless they logout manually or the
// session expires.
// ============================================

const SESSION_EXPIRY_KEY = '__session_expires_at';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// All session-related keys we manage
const SESSION_KEYS = [
  'accessToken',
  'userId',
  'userRole',
  'selectedStore',
  'storeId',
  SESSION_EXPIRY_KEY,
];

function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  const expiresAt = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiresAt) return false;
  return Date.now() <= parseInt(expiresAt, 10);
}

function updateExpiry(): void {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString());
}

/**
 * Drop-in replacement for `sessionStorage` that persists data
 * in `localStorage` with a 7-day expiry window.
 *
 * - On `getItem`: returns `null` if the session has expired.
 * - On `setItem`: resets the 7-day expiry timer.
 * - On `clear`: removes all session keys and the expiry marker.
 */
export const session = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    if (!isSessionValid()) {
      session.clear();
      return null;
    }
    return localStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
    updateExpiry();
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  },

  /** Check if there is an active, non-expired session with a logged-in user. */
  isActive(): boolean {
    return isSessionValid() && !!localStorage.getItem('userId');
  },

  /** Return the role stored in the session, or null. */
  getRole(): string | null {
    return session.getItem('userRole');
  },
};
