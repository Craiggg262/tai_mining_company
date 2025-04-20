import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Calendar, Percent, Clock } from "lucide-react";
import { formatDateShort, getStatusColor, calculateTimeLeft, formatTimeLeft } from "@/lib/utils";
import { useEffect } from "react";
import { STAKING_PERIOD_DAYS, STAKING_APY } from "@/lib/constants";

export default function Staking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [timeLefts, setTimeLefts] = useState<{[key: number]: string}>({});

  // Fetch staking data
  const { data: stakingsData, isLoading: isLoadingStakings } = useQuery({
    queryKey: ['/api/stakings', user?.id],
    enabled: !!user,
  });

  // Update countdown timers
  useEffect(() => {
    if (!stakingsData?.stakings?.length) return;
    
    const updateTimers = () => {
      const newTimeLefts: {[key: number]: string} = {};
      stakingsData.stakings.forEach((staking: any) => {
        if (staking.status === "active") {
          const timeLeft = calculateTimeLeft(staking.endAt);
          newTimeLefts[staking.id] = formatTimeLeft(timeLeft);
        }
      });
      setTimeLefts(newTimeLefts);
    };
    
    updateTimers(); // Initial update
    
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [stakingsData]);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount) return;
    
    const stakeAmount = parseFloat(amount);
    
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid staking amount",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough balance
    if (stakeAmount > (user.taiBalance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough TAI to stake",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsStaking(true);
      await apiRequest("POST", "/api/wallet/stake", {
        userId: user.id,
        amount: stakeAmount,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stakings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Staking successful",
        description: `${stakeAmount.toFixed(2)} TAI has been staked for ${STAKING_PERIOD_DAYS} days`,
      });
      
      // Reset form
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Staking failed",
        description: error.message || "Could not complete staking",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  // Calculate expected returns
  const calculateReturns = () => {
    if (!amount) return "0.00";
    const stakeAmount = parseFloat(amount);
    if (isNaN(stakeAmount)) return "0.00";
    
    // Calculate based on APY for the staking period
    const dailyRate = STAKING_APY / 365 / 100;
    const periodReturn = stakeAmount * dailyRate * STAKING_PERIOD_DAYS;
    return periodReturn.toFixed(2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Staking</h1>
          <p className="text-muted-foreground">
            Stake your TAI to earn passive income
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Stake TAI</CardTitle>
              <CardDescription>
                Lock your TAI for {STAKING_PERIOD_DAYS} days to earn {STAKING_APY}% APY
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStake} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Stake (TAI)</Label>
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
                      Available balance: {user?.taiBalance?.toFixed(2) || "0.00"} TAI
                    </p>
                  </div>
                  
                  <div className="bg-primary/10 p-4 rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Locking Period</span>
                      </div>
                      <span className="font-medium">{STAKING_PERIOD_DAYS} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        <Percent className="h-4 w-4 mr-2" />
                        <span>Annual Yield</span>
                      </div>
                      <span className="font-medium">{STAKING_APY}% APY</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        <Lock className="h-4 w-4 mr-2" />
                        <span>Expected Returns</span>
                      </div>
                      <span className="font-medium">{calculateReturns()} TAI</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isStaking}
                >
                  {isStaking ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" /> Stake Now
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Staking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Staking Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How Staking Works</h3>
                <p className="text-muted-foreground text-sm">
                  When you stake your TAI, it's locked for a period of {STAKING_PERIOD_DAYS} days. 
                  During this period, you'll earn {STAKING_APY}% APY on your staked amount.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Reward Distribution</h3>
                <p className="text-muted-foreground text-sm">
                  Staking rewards are calculated daily and distributed at the end of the staking period. 
                  The rewards are automatically added to your TAI balance.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Locking Period</h3>
                <p className="text-muted-foreground text-sm">
                  Your staked TAI is locked for the entire period and cannot be withdrawn early. 
                  After the staking period ends, your principal plus earned rewards are returned to your TAI balance.
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Current TAI Balance</h3>
                <p className="text-2xl font-mono">{user?.taiBalance?.toFixed(2) || "0.00"} TAI</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Stakings */}
        <Card>
          <CardHeader>
            <CardTitle>Your Staking Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Estimated Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStakings ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex justify-center">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : stakingsData?.stakings?.length > 0 ? (
                  stakingsData.stakings.map((staking: any) => {
                    const { bg, text } = getStatusColor(staking.status);
                    const dailyRate = STAKING_APY / 365 / 100;
                    const estimatedReturn = staking.amount * dailyRate * STAKING_PERIOD_DAYS;
                    
                    return (
                      <TableRow key={staking.id}>
                        <TableCell>{formatDateShort(staking.startedAt)}</TableCell>
                        <TableCell>{formatDateShort(staking.endAt)}</TableCell>
                        <TableCell>{staking.amount.toFixed(2)} TAI</TableCell>
                        <TableCell className="text-secondary">
                          +{estimatedReturn.toFixed(2)} TAI
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${bg} ${text}`}>
                            {staking.status.charAt(0).toUpperCase() + staking.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {staking.status === "active" ? (
                            <div className="space-y-1">
                              <div className="flex items-center text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {timeLefts[staking.id] || "Loading..."}
                              </div>
                              <Progress 
                                value={
                                  ((new Date().getTime() - new Date(staking.startedAt).getTime()) /
                                  (new Date(staking.endAt).getTime() - new Date(staking.startedAt).getTime())) * 100
                                }
                                className="h-1"
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {staking.status === "completed" ? "Completed" : "Withdrawn"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No active staking positions. Start staking to earn rewards!
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
