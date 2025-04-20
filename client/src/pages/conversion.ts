import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, ChevronRight } from "lucide-react";
import { TAI_TO_USDT_RATE } from "@/lib/constants";

export default function Conversion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("TAI");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [convertedAmount, setConvertedAmount] = useState("0.00");
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    calculateConversion();
  }, [amount, fromCurrency, toCurrency]);

  const calculateConversion = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setConvertedAmount("0.00");
      return;
    }
    
    const inputAmount = parseFloat(amount);
    
    if (fromCurrency === "TAI" && toCurrency === "USDT") {
      setConvertedAmount((inputAmount * TAI_TO_USDT_RATE).toFixed(2));
    } else if (fromCurrency === "USDT" && toCurrency === "TAI") {
      setConvertedAmount((inputAmount / TAI_TO_USDT_RATE).toFixed(2));
    } else {
      setConvertedAmount(inputAmount.toFixed(2));
    }
  };

  const switchCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount) return;
    
    const inputAmount = parseFloat(amount);
    
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough balance
    if (fromCurrency === "TAI" && inputAmount > (user.taiBalance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough TAI to convert",
        variant: "destructive",
      });
      return;
    }
    
    if (fromCurrency === "USDT" && inputAmount > (user.usdtBalance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough USDT to convert",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsConverting(true);
      await apiRequest("POST", "/api/wallet/convert", {
        userId: user.id,
        amount: inputAmount,
        fromCurrency,
        toCurrency,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Conversion successful",
        description: `${inputAmount.toFixed(2)} ${fromCurrency} has been converted to ${convertedAmount} ${toCurrency}`,
      });
      
      // Reset form
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Conversion failed",
        description: error.message || "Could not complete the conversion",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Conversion</h1>
          <p className="text-muted-foreground">
            Convert between TAI and USDT
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Currency Conversion</CardTitle>
            <CardDescription>
              Current rate: 1 TAI = {TAI_TO_USDT_RATE} USDT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvert} className="space-y-6">
              <div className="space-y-4">
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
                </div>
                
                <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-currency">From</Label>
                    <Select
                      value={fromCurrency}
                      onValueChange={setFromCurrency}
                    >
                      <SelectTrigger id="from-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TAI">TAI</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Available: {fromCurrency === "TAI" ? user?.taiBalance?.toFixed(2) : user?.usdtBalance?.toFixed(2) || "0.00"} {fromCurrency}
                    </p>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={switchCurrencies}
                    className="mt-6"
                  >
                    <ArrowDownUp className="h-4 w-4" />
                  </Button>
                  
                  <div className="space-y-2">
                    <Label htmlFor="to-currency">To</Label>
                    <Select
                      value={toCurrency}
                      onValueChange={setToCurrency}
                    >
                      <SelectTrigger id="to-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TAI">TAI</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">You will receive</span>
                    <span className="text-xl font-bold">{convertedAmount} {toCurrency}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isConverting || !amount || fromCurrency === toCurrency}
              >
                {isConverting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Convert Now <ChevronRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Currency Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                You can convert between TAI and USDT at any time. 
                The current conversion rate is:
              </p>
              <div className="bg-primary/10 p-4 rounded-md">
                <p className="font-medium text-center">1 TAI = {TAI_TO_USDT_RATE} USDT</p>
              </div>
              <p>
                There are no fees for conversion. The minimum conversion amount is 0.01 TAI or USDT.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
