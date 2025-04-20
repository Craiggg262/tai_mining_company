import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WalletBalance } from "@/components/shared/WalletBalance";
import { TransactionHistory } from "@/components/shared/TransactionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

export default function Wallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientTaiId, setRecipientTaiId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !transferAmount || !recipientTaiId) return;
    
    const amount = parseFloat(transferAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to transfer",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > (user.taiBalance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough TAI to complete this transfer",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsTransferring(true);
      await apiRequest("POST", "/api/wallet/transfer", {
        userId: user.id,
        amount,
        taiId: recipientTaiId,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Transfer successful",
        description: `${amount.toFixed(2)} TAI has been sent to ${recipientTaiId}`,
      });
      
      // Reset form
      setTransferAmount("");
      setRecipientTaiId("");
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message || "Could not complete the transfer",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your TAI and USDT balances
          </p>
        </div>

        {/* Wallet Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletBalance type="tai" />
          <WalletBalance type="usdt" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="outline" onClick={() => setLocation("/conversion")}>
            Convert
          </Button>
          <Button variant="outline" onClick={() => setLocation("/deposit")}>
            Deposit
          </Button>
          <Button variant="outline" onClick={() => setLocation("/withdrawal")}>
            Withdraw
          </Button>
          <Button variant="outline" onClick={() => setLocation("/staking")}>
            Stake
          </Button>
        </div>

        {/* Transfer TAI Form */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer TAI</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient TAI ID</Label>
                <Input
                  id="recipient"
                  placeholder="Enter recipient's TAI ID"
                  value={recipientTaiId}
                  onChange={(e) => setRecipientTaiId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (TAI)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available balance: {user?.taiBalance?.toFixed(2) || "0.00"} TAI
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isTransferring}
              >
                {isTransferring ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Transfer <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <TransactionHistory 
          limit={10}
          showViewAll={true}
          onViewAll={() => setLocation("/history")}
        />
      </div>
    </DashboardLayout>
  );
}
