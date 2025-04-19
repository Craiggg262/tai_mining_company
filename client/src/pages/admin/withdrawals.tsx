import { AdminLayout } from "@/components/admin/AdminLayout";
import { WithdrawalRequests } from "@/components/admin/WithdrawalRequests";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";

export default function AdminWithdrawals() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch withdrawals
  const { data: withdrawalsData, isLoading } = useQuery({
    queryKey: ['/api/admin/withdrawals', user?.id],
    enabled: !!user
  });

  // Get processed withdrawals from history (simulated)
  const { data: usersData } = useQuery({
    queryKey: ['/api/admin/users', user?.id],
    enabled: !!user
  });

  // Filter withdrawals based on search query
  const filterWithdrawals = (withdrawals: any[] | undefined, query: string) => {
    if (!withdrawals) return [];
    if (!query) return withdrawals;
    
    query = query.toLowerCase();
    return withdrawals.filter(
      withdrawal => 
        (withdrawal.user?.name && withdrawal.user.name.toLowerCase().includes(query)) || 
        (withdrawal.user?.email && withdrawal.user.email.toLowerCase().includes(query)) ||
        withdrawal.address.toLowerCase().includes(query) ||
        withdrawal.currency.toLowerCase().includes(query)
    );
  };

  const pendingWithdrawals = filterWithdrawals(withdrawalsData?.withdrawals, searchQuery);

  // This is simulated history - in a real app, we would fetch this from the API
  const getProcessedWithdrawals = () => {
    if (!usersData?.users) return [];
    
    // Create some simulated withdrawal history based on users
    const processedWithdrawals = [];
    const statuses = ["approved", "rejected"];
    const currencies = ["TAI", "USDT"];
    
    for (let i = 0; i < 10; i++) {
      const randomUser = usersData.users[Math.floor(Math.random() * usersData.users.length)];
      if (!randomUser) continue;
      
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      processedWithdrawals.push({
        id: i + 1,
        userId: randomUser.id,
        user: {
          name: randomUser.name,
          email: randomUser.email,
          taiId: randomUser.taiId
        },
        amount: Math.floor(Math.random() * 100) + 1,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        address: `TXa${Math.random().toString(36).substring(2, 15)}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(date.setDate(date.getDate() - 1)).toISOString(),
        processedAt: date.toISOString(),
        processedBy: user?.id
      });
    }
    
    return filterWithdrawals(processedWithdrawals, searchQuery);
  };

  const processedWithdrawals = getProcessedWithdrawals();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold">Withdrawal Management</h2>
          <p className="text-muted-foreground">
            Review and approve pending withdrawal requests
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search withdrawals by user, address, or currency..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingWithdrawals?.length || 0})</TabsTrigger>
            <TabsTrigger value="processed">Processed History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <WithdrawalRequests filterQuery={searchQuery} />
          </TabsContent>
          
          <TabsContent value="processed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Processed Withdrawals</CardTitle>
                <CardDescription>
                  History of all processed withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedWithdrawals.length > 0 ? (
                      processedWithdrawals.map((withdrawal) => {
                        const { bg, text } = getStatusColor(withdrawal.status);
                        
                        return (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{withdrawal.user.name}</p>
                                <p className="text-xs text-muted-foreground">{withdrawal.user.email}</p>
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
                            <TableCell className="text-muted-foreground">
                              {formatDate(withdrawal.processedAt)}
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
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No processed withdrawals found
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
    </AdminLayout>
  );
}
