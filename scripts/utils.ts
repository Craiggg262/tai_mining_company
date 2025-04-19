// Utility functions for scripts

export function generateTaiId(): string {
  return `TAI${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export function generateReferralCode(): string {
  return `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}