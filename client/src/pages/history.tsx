import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
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
import { 
  formatDate, 
  formatTransactionType, 
  getStatusColor, 
  getTransactionIcon 
} from "@/lib/utils";

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

interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  address: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export default function History() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    enabled: !!user,
  });
  
  // Fetch withdrawals
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['/api/withdrawals', user?.id],
    enabled: !!user,
  });

  const filterTransactions = (transactions: Transaction[] | undefined, query: string) => {
    if (!transactions) return [];
    if (!query) return transactions;
    
    return transactions.filter(
      tx => 
        tx.type.includes(query.toLowerCase()) || 
        tx.description.toLowerCase().includes(query.toLowerCase()) ||
        formatTransactionType(tx.type).toLowerCase().includes(query.toLowerCase())
    );
  };

  const filterWithdrawals = (withdrawals: Withdrawal[] | undefined, query: string) => {
    if (!withdrawals) return [];
    if (!query) return withdrawals;
    
    return withdrawals.filter(
      w => 
        w.address.toLowerCase().includes(query.toLowerCase()) || 
        w.currency.toLowerCase().includes(query.toLowerCase()) ||
        w.status.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredTransactions = filterTransactions(transactionsData?.transactions, searchQuery);
  const filteredWithdrawals = filterWithdrawals(withdrawalsData?.withdrawals, searchQuery);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Transaction History</h1>
          <p className="text-muted-foreground">
            View all your transactions and withdrawals
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <div className="flex justify-center">
                            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions?.length > 0 ? (
                      filteredTransactions.map((transaction: Transaction) => {
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
                            <TableCell className="max-w-[200px] truncate">
                              {transaction.description || 
                                formatTransactionType(transaction.type) + " transaction"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${bg} ${text}`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          {searchQuery ? "No matching transactions found" : "No transactions yet"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="withdrawals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingWithdrawals ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <div className="flex justify-center">
                            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredWithdrawals?.length > 0 ? (
                      filteredWithdrawals.map((withdrawal: Withdrawal) => {
                        const { bg, text } = getStatusColor(withdrawal.status);
                        
                        return (
                          <TableRow key={withdrawal.id}>
                            <TableCell className="text-muted-foreground">
                              {formatDate(withdrawal.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {withdrawal.amount.toFixed(2)} {withdrawal.currency}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate">
                              {withdrawal.address}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${bg} ${text}`}>
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : "Pending"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          {searchQuery ? "No matching withdrawals found" : "No withdrawals yet"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
