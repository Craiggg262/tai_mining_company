import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { withdrawals } from "@shared/schema";

interface WithdrawalRequestsProps {
  filterQuery?: string;
}

export function WithdrawalRequests({ filterQuery = "" }: WithdrawalRequestsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");

  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/withdrawals', user?.id],
    enabled: !!user
  });

  // Filter withdrawals based on query if provided
  const getFilteredWithdrawals = () => {
    if (!data?.(withdrawals.map(withdrawals))) return [];
    if (!filterQuery) return data as any;
    
    const query = filterQuery.toLowerCase();
    return data.(withdrawals).filter(
      (w: any) => 
        (w.user?.name && w.user.name.toLowerCase().includes(query)) || 
        (w.user?.email && w.user.email.toLowerCase().includes(query)) ||
        w.address.toLowerCase().includes(query) ||
        w.currency.toLowerCase().includes(query)
    );
  };

  const filteredWithdrawals = getFilteredWithdrawals();

  const openConfirmDialog = (withdrawal: any, type: "approved" | "rejected") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setIsConfirmOpen(true);
  };

  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal || !user) return;
    
    try {
      setIsProcessing(true);
      await apiRequest('POST', '/api/admin/process-withdrawal', {
        adminId: user.id,
        withdrawalId: selectedWithdrawal.id,
        status: actionType
      });

      toast({
        title: `Withdrawal ${actionType}`,
        description: `You have ${actionType} the withdrawal of ${selectedWithdrawal.amount} ${selectedWithdrawal.currency}`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      
      setIsConfirmOpen(false);
    } catch (error: any) {
      toast({
        title: "Process Failed",
        description: error.message || "Could not process the withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Withdrawals</CardTitle>
        <CardDescription>
          Review and process withdrawal requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="mx-auto h-10 w-10 text-secondary opacity-30 mb-2" />
            <p>No pending withdrawals to process</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal: any) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(withdrawal.user?.name || "User")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{withdrawal.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{withdrawal.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{withdrawal.amount.toFixed(2)} {withdrawal.currency}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {withdrawal.address}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(withdrawal.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => openConfirmDialog(withdrawal, "approved")}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openConfirmDialog(withdrawal, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approved" ? "Approve Withdrawal" : "Reject Withdrawal"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approved" 
                  ? "This will approve the withdrawal request and notify the user."
                  : "This will reject the withdrawal request and return funds to the user's wallet."
                }
              </DialogDescription>
            </DialogHeader>
            
            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-medium">{selectedWithdrawal.user?.name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-mono text-xs">{selectedWithdrawal.address}</span>
                  </p>
                </div>
                
                <Alert variant={actionType === "approved" ? "default" : "destructive"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    {actionType === "approved"
                      ? "Once approved, this action cannot be undone. The funds will be transferred to the user's external wallet."
                      : "Rejecting this withdrawal will return the funds to the user's account balance."
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                variant={actionType === "approved" ? "default" : "destructive"}
                onClick={handleProcessWithdrawal}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  actionType === "approved" ? "Confirm Approval" : "Confirm Rejection"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
