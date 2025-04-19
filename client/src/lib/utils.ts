import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance, formatRelative, isToday, isYesterday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, "h:mm a")}`;
  } else if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, "h:mm a")}`;
  } else if (isTomorrow(dateObj)) {
    return `Tomorrow at ${format(dateObj, "h:mm a")}`;
  }
  
  return format(dateObj, "MMM d, yyyy h:mm a");
}

export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
}

export function formatTimeDistance(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

export function formatTimeDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatTransactionType(type: string): string {
  switch (type) {
    case "mining_reward":
      return "Mining Reward";
    case "referral_bonus":
      return "Referral Bonus";
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    case "transfer_sent":
      return "Transfer Sent";
    case "transfer_received":
      return "Transfer Received";
    case "conversion":
      return "Conversion";
    case "staking":
      return "Staking";
    case "staking_reward":
      return "Staking Reward";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function getStatusColor(status: string): {bg: string, text: string} {
  switch (status) {
    case "completed":
      return { bg: "bg-green-500/20", text: "text-green-500" };
    case "pending":
      return { bg: "bg-yellow-500/20", text: "text-yellow-500" };
    case "rejected":
      return { bg: "bg-red-500/20", text: "text-red-500" };
    case "active":
      return { bg: "bg-green-500/20", text: "text-green-500" };
    default:
      return { bg: "bg-gray-500/20", text: "text-gray-500" };
  }
}

export function getTransactionIcon(type: string): string {
  switch (type) {
    case "mining_reward":
      return "hammer";
    case "referral_bonus":
      return "users";
    case "deposit":
      return "wallet";
    case "withdrawal":
      return "credit-card";
    case "transfer_sent":
      return "arrow-up";
    case "transfer_received":
      return "arrow-down";
    case "conversion":
      return "refresh-cw";
    case "staking":
      return "lock";
    case "staking_reward":
      return "gift";
    default:
      return "circle";
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function generateGradientByText(text: string): string {
  // Generate a consistent hash of the string
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate 3 colors
  const color1 = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  const color2 = `hsl(${(Math.abs(hash) + 120) % 360}, 70%, 50%)`;
  
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function truncateAddress(address: string, first = 8, last = 8): string {
  if (address.length <= first + last) return address;
  return `${address.slice(0, first)}...${address.slice(-last)}`;
}

export function truncateMiddle(text: string, length = 20): string {
  if (text.length <= length) return text;
  const halfLength = Math.floor(length / 2);
  return `${text.slice(0, halfLength)}...${text.slice(-halfLength)}`;
}

export function calculateTimeLeft(targetDate: Date | string): { hours: number, minutes: number, seconds: number } {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const now = new Date();
  const difference = target.getTime() - now.getTime();
  
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);
  
  return { hours, minutes, seconds };
}

export function formatTimeLeft(timeLeft: { hours: number, minutes: number, seconds: number }): string {
  const { hours, minutes, seconds } = timeLeft;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
