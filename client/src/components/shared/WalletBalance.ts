import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletBalanceProps {
  type: "tai" | "usdt";
  className?: string;
  showChange?: boolean;
}

export function WalletBalance({ type, className, showChange = true }: WalletBalanceProps) {
  const { user, updateBalance } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/wallet/balance', user?.id],
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    onSuccess: (data: { taiBalance: number; usdtBalance: number; }) => {
      if (data) {
        updateBalance(data.taiBalance, data.usdtBalance);
      }
    }
  });
  
  const getIcon = () => {
    if (type === "tai") {
      return <Wallet className="h-6 w-6 text-primary" />;
    } else {
      return <DollarSign className="h-6 w-6 text-warning" />;
    }
  };
  
  const getBalance = () => {
    if (isLoading) return <Skeleton className="h-8 w-24" />;
    
    if (user) {
      return type === "tai" 
        ? user.taiBalance.toFixed(2)
        : user.usdtBalance.toFixed(2);
    }
    
    return "0.00";
  };
  
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{type === "tai" ? "Tai Balance" : "USDT Balance"}</h2>
          <div className={`p-2 rounded-full ${type === "tai" ? "bg-primary/20" : "bg-warning/20"}`}>
            {getIcon()}
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold font-mono">{getBalance()}</span>
          <span className="ml-2 text-muted-foreground">{type === "tai" ? "TAI" : "USDT"}</span>
        </div>
        {showChange && (
          <div className="mt-4 flex items-center text-sm">
            {type === "tai" ? (
              <span className="flex items-center text-secondary">
                <TrendingUp className="h-4 w-4 mr-1" />
                0.25
                <span className="text-muted-foreground ml-1">
                  earned per hour while mining
                </span>
              </span>
            ) : (
              <span className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                ≈ ${data?.(updateBalance?.toFixed(2)) || "0.00"} USD
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
