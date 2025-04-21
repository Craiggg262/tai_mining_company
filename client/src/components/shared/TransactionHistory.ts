import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { 
  formatDate, 
  formatTransactionType, 
  getStatusColor, 
  getTransactionIcon 
} from "@/lib/utils";
import { 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  RefreshCw, 
  Gift, 
  Wallet, 
  CreditCard, 
  Users, 
  Hammer, 
  Lock,
  LucideIcon
} from "lucide-react";
import { transactions } from "@shared/schema";

interface TransactionHistoryProps {
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string;
  recipientId: number | null;
}

export function TransactionHistory({ 
  limit = 5, 
  showViewAll = true, 
  onViewAll, 
  className 
}: TransactionHistoryProps) {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    enabled: !!user
  });

  const getTransactions = () => {
    if (isLoading || !data?.(transactions.map(transactions))) {
      return Array(limit).fill(0).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
        </TableRow>
      ));
    }

    return data.transactions
      .slice(0, limit)
      .map((transaction: Transaction) => {
        const { bg, text } = getStatusColor(transaction.status);
        const iconName = getTransactionIcon(transaction.type);
        
        const icons: Record<string, LucideIcon> = {
          'hammer': Hammer,
          'users': Users,
          'wallet': Wallet,
          'credit-card': CreditCard,
          'arrow-up': ArrowUp,
          'arrow-down': ArrowDown,
          'refresh-cw': RefreshCw,
          'lock': Lock,
          'gift': Gift,
          'circle': Clock
        };
        
        const Icon = icons[iconName] || Clock;
        
        const isPositive = 
          transaction.type === 'mining_reward' || 
          transaction.type === 'referral_bonus' || 
          transaction.type === 'deposit' ||
          transaction.type === 'transfer_received' ||
          transaction.type === 'staking_reward';
        
        const amountColor = isPositive ? 'text-secondary' : 'text-primary';
        const amountPrefix = isPositive ? '+' : '-';
        
        // Special case for conversion, don't show prefix
        const displayAmount = transaction.type === 'conversion' 
          ? `${transaction.amount.toFixed(2)} ${transaction.currency}`
          : `${amountPrefix}${transaction.amount.toFixed(2)} ${transaction.currency}`;
        
        return (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{formatTransactionType(transaction.type)}</span>
              </div>
            </TableCell>
            <TableCell className={amountColor + " font-medium"}>
              {displayAmount}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(transaction.createdAt)}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={`${bg} ${text}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </TableCell>
          </TableRow>
        );
      });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          {showViewAll && onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getTransactions()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
