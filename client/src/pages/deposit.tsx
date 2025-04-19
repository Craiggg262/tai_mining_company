import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DEPOSIT_ADDRESS, MIN_DEPOSIT_AMOUNT } from "@/lib/constants";
import { BLOCKCHAIN_SVG } from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";

export default function Deposit() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(DEPOSIT_ADDRESS);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Address Copied",
        description: "TRC-20 address has been copied to clipboard",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Deposit</h1>
          <p className="text-muted-foreground">
            Fund your account with USDT
          </p>
        </div>

        <Tabs defaultValue="trc20" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="trc20">TRC-20 (TRON)</TabsTrigger>
            <TabsTrigger value="other" disabled>Other Networks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trc20" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Deposit USDT (TRC-20)</CardTitle>
                <CardDescription>
                  Send USDT to the address below to fund your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="w-48 h-48 flex items-center justify-center mb-4" 
                    dangerouslySetInnerHTML={{ __html: BLOCKCHAIN_SVG }}
                  ></div>
                  
                  <div className="relative w-full max-w-md">
                    <div className="p-4 bg-muted rounded-md font-mono text-sm break-all">
                      {DEPOSIT_ADDRESS}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={handleCopyAddress}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleCopyAddress}
                    className="w-full max-w-md"
                  >
                    {copied ? "Copied!" : "Copy Address"}
                  </Button>
                </div>
                
                <Alert variant="destructive" className="bg-destructive/20 border-destructive/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Minimum deposit: ${MIN_DEPOSIT_AMOUNT} USDT</li>
                      <li>Only send USDT (TRC-20) to this address</li>
                      <li>Sending any other tokens may result in permanent loss</li>
                      <li>Deposits typically confirm within 10-30 minutes</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>About Deposits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  After your deposit is confirmed, the USDT will be credited to your account. 
                  You can then convert it to TAI for mining or staking.
                </p>
                <p>
                  If your deposit doesn't appear after 1 hour, please contact our support team with your transaction details.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
