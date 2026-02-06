/**
 * Validate that email belongs to allowed college domain
 * Only NITJ students (nitj.ac.in) can register
 */

export function isAllowedEmailDomain(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || 'nitj.ac.in')
    .split(',')
    .map((d) => d.trim().toLowerCase());
  return allowed.includes(domain);
}

export function getAllowedDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS || 'nitj.ac.in').split(',').map((d) => d.trim());
}
