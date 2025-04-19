// Currency conversion rate
export const TAI_TO_USDT_RATE = 0.6;

// Mining rate
export const MINING_RATE_PER_HOUR = 0.25;

// Referral bonus amount
export const REFERRAL_BONUS = 0.5;

// Minimum deposit amount
export const MIN_DEPOSIT_AMOUNT = 6; // USDT

// Deposit address
export const DEPOSIT_ADDRESS = "TBc7FqYfELGecbivMaKLhvdkJjbyXFB9cH";

// Staking period in days
export const STAKING_PERIOD_DAYS = 30;

// Annual Percentage Yield for staking
export const STAKING_APY = 12; // 12%

// Transaction types
export const TRANSACTION_TYPES = {
  MINING_REWARD: "mining_reward",
  REFERRAL_BONUS: "referral_bonus",
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  TRANSFER_SENT: "transfer_sent",
  TRANSFER_RECEIVED: "transfer_received",
  CONVERSION: "conversion",
  STAKING: "staking",
  STAKING_REWARD: "staking_reward"
};

// Transaction statuses
export const TRANSACTION_STATUSES = {
  COMPLETED: "completed",
  PENDING: "pending",
  REJECTED: "rejected"
};

// Navigation items
export const NAV_ITEMS = [
  { 
    title: "Dashboard", 
    path: "/dashboard", 
    icon: "home" 
  },
  { 
    title: "Mining", 
    path: "/mining", 
    icon: "hammer" 
  },
  { 
    title: "Wallet", 
    path: "/wallet", 
    icon: "wallet" 
  },
  { 
    title: "Conversion", 
    path: "/conversion", 
    icon: "refresh-cw" 
  },
  { 
    title: "Deposit", 
    path: "/deposit", 
    icon: "download" 
  },
  { 
    title: "Withdrawal", 
    path: "/withdrawal", 
    icon: "upload" 
  },
  { 
    title: "Staking", 
    path: "/staking", 
    icon: "lock" 
  },
  { 
    title: "Referral", 
    path: "/referral", 
    icon: "users" 
  },
  { 
    title: "History", 
    path: "/history", 
    icon: "clock" 
  }
];

// Admin navigation items
export const ADMIN_NAV_ITEMS = [
  { 
    title: "Dashboard", 
    path: "/admin/dashboard", 
    icon: "layout-dashboard" 
  },
  { 
    title: "Users", 
    path: "/admin/users", 
    icon: "users" 
  },
  { 
    title: "Withdrawals", 
    path: "/admin/withdrawals", 
    icon: "credit-card" 
  },
  { 
    title: "Settings", 
    path: "/admin/settings", 
    icon: "settings" 
  }
];

// SVG images for crypto related visuals
export const CRYPTO_MINING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 18V13L8 15L11 18Z"/><path d="M16 11H15V4H8V5H4V11H8V12H12V19H20V12H16V11Z"/><circle cx="20" cy="9" r="2"/><rect x="4" y="15" width="4" height="4" rx="1"/></svg>`;

export const WALLET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7h-3a2 2 0 0 1 0-4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="16" cy="13" r="2"/></svg>`;

export const BLOCKCHAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="17" y1="10" x2="17" y2="14"/><line x1="10" y1="7" x2="14" y2="7"/><line x1="10" y1="17" x2="14" y2="17"/></svg>`;

export const REFERRAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

export const STAKING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="12" y1="15" x2="12" y2="17"/></svg>`;
