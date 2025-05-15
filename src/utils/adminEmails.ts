/**
 * Simple utility for managing admin email addresses.
 * This ensures there's a single source of truth for admin emails.
 */

// Add all admin email addresses here
export const ADMIN_EMAILS = [
  'simpalori@gmail.com'
];

/**
 * Checks if an email is in the admin list
 */
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Checks if the current user is using an admin email
 * @param currentEmail The email to check
 */
export const isCurrentUserAdmin = (currentEmail?: string | null): boolean => {
  if (!currentEmail) return false;
  return isAdminEmail(currentEmail);
};