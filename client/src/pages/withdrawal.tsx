import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CreditCard } from "lucide-react";
import { formatDateShort, formatCurrency, getStatusColor } from "@/lib/utils";

export default function Withdrawal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("TAI");
  const [address, setAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch withdrawal history
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['/api/withdrawals', user?.id],
    enabled: !!user,
  });

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || !currency || !address) return;
    
    const withdrawalAmount = parseFloat(amount);
    
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough balance
    if (currency === "TAI" && withdrawalAmount > (user.taiBalance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough TAI to withdraw",
        variant: "destructive",
      });
      return;
    }
    
    if (currency === "USDT" && withdrawalAmount > (user.usdtBalance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough USDT to withdraw",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsWithdrawing(true);
      await apiRequest("POST", "/api/wallet/withdraw", {
        userId: user.id,
        amount: withdrawalAmount,
        currency,
        address,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      
      toast({
        title: "Withdrawal request submitted",
        description: `Your request to withdraw ${withdrawalAmount.toFixed(2)} ${currency} is pending approval`,
      });
      
      // Reset form
      setAmount("");
      setAddress("");
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Could not process your withdrawal request",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Withdrawal</h1>
          <p className="text-muted-foreground">
            Withdraw your TAI or USDT to external wallet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Withdrawals are processed within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawal} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={currency}
                      onValueChange={setCurrency}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TAI">TAI</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {currency === "TAI" ? user?.taiBalance?.toFixed(2) : user?.usdtBalance?.toFixed(2) || "0.00"} {currency}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Withdrawal Address</Label>
                    <Input
                      id="address"
                      placeholder={`Enter your ${currency} wallet address`}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Alert variant="destructive" className="bg-destructive/20 border-destructive/50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please double-check your withdrawal address. Incorrect addresses may result in permanent loss of funds.
                    </AlertDescription>
                  </Alert>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" /> Request Withdrawal
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdrawal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Processing Time</h3>
                <p className="text-muted-foreground text-sm">
                  All withdrawal requests are manually reviewed and processed within 24 hours.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Verification</h3>
                <p className="text-muted-foreground text-sm">
                  You will receive an email confirmation when your withdrawal is approved and processed.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Network Fees</h3>
                <p className="text-muted-foreground text-sm">
                  Network fees are deducted from your withdrawal amount. The minimum withdrawal amount is 1 TAI or 1 USDT.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Current Balances</h3>
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">TAI:</span> {user?.taiBalance?.toFixed(2) || "0.00"} TAI</p>
                  <p><span className="text-muted-foreground">USDT:</span> {user?.usdtBalance?.toFixed(2) || "0.00"} USDT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingWithdrawals ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <div className="flex justify-center">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : withdrawalsData?.withdrawals?.length > 0 ? (
                  withdrawalsData.withdrawals.map((withdrawal: any) => {
                    const { bg, text } = getStatusColor(withdrawal.status);
                    
                    return (
                      <TableRow key={withdrawal.id}>
                        <TableCell>{formatDateShort(withdrawal.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(withdrawal.amount, withdrawal.currency)}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {withdrawal.address}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${bg} ${text}`}>
                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No withdrawal history yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
