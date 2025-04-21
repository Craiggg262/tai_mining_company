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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateShort } from "@/lib/utils";
import UsersList from "@/pages/admin/users";


interface User {
  id: number;
  name: string;
  email: string;
  taiBalance: number;
  usdtBalance: number;
  taiId: string;
  referralCode: string;
  createdAt: string;
  emailVerified: boolean;
}

interface UsersResponse {
  users: User[];
}

export function usersData ()
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState<{ tai: string; usdt: string }>({
    tai: "",
    usdt: "",
  });

  const { isLoading } = useQuery({
    queryKey: ['/api/admin/users', adminUser?.id],
    enabled: !!adminUser
  });

  const handleFundUser = async () => {
    if (!selectedUser || (!fundAmount.tai && !fundAmount.usdt)) return;

    try {
      await apiRequest('POST', '/api/admin/fund-user', {
        adminId: adminUser?.id,
        userId: selectedUser.id,
        taiAmount: fundAmount.tai ? parseFloat(fundAmount.tai) : 0,
        usdtAmount: fundAmount.usdt ? parseFloat(fundAmount.usdt) : 0,
      });

      toast({
        title: "User Funded",
        description: `Successfully funded ${selectedUser.name}'s wallet.`,
      });

      // Invalidate users query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setDialogOpen(false);
      setFundAmount({ tai: "", usdt: "" });
    } catch (error: any) {
      toast({
        title: "Funding Failed",
        description: error.message || "Could not fund user wallet",
        variant: "destructive",
      });
    }
  };

  const openFundDialog = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  if (isLoading) {
     (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  const { data } = useQuery ("users", fetchUsers);

    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>TAI Balance</TableHead>
                <TableHead>USDT Balance</TableHead>
                <TableHead>TAI ID</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

 <TableBody>           

{data?.users.map ((user) => (
  <div key={user.id}>{user.name}</div>
))}
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.email}
                      {!user.emailVerified && (
                        <span className="ml-2 text-xs text-amber-500">(Unverified)</span>
                      )}
                    </TableCell>
                    <TableCell>{user.taiBalance.toFixed(2)} TAI</TableCell>
                    <TableCell>{user.usdtBalance.toFixed(2)} USDT</TableCell>
                    <TableCell className="font-mono text-xs">{user.taiId}</TableCell>
                    <TableCell>{formatDateShort(user.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFundDialog(user)}
                      >
                        Fund
                      </Button>
                    </TableCell>
                  </TableRow>
             </TableBody>
             </Table>
            </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fund User Wallet</DialogTitle>
              <DialogDescription>
                Add funds to {selectedUser?.name}'s wallet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tai-amount" className="text-right">
                  TAI Amount
                </Label>
                <Input
                  id="tai-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fundAmount.tai}
                  onChange={(e) => setFundAmount({ ...fundAmount, tai: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="usdt-amount" className="text-right">
                  USDT Amount
                </Label>
                <Input
                  id="usdt-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fundAmount.usdt}
                  onChange={(e) => setFundAmount({ ...fundAmount, usdt: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFundUser}>
                Fund Wallet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </CardContent>
      </Card>
    

