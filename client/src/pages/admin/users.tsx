import { AdminLayout } from "@/components/admin/AdminLayout";
import { UsersList } from "@/components/admin/UsersList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { users } from "@shared/schema";

export default function AdminUsers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users', user?.id],
    enabled: !!user
  });

  // Filter users based on search query
  const filterUsers = (users: any[] | undefined, query: string) => {
    if (!users) return [];
    if (!query) return users;
    
    query = query.toLowerCase();
    return users.filter(
      user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query) ||
        user.taiId.toLowerCase().includes(query)
    );
  };

  const getActiveUsers = (users: any[] | undefined) => {
    if (!users) return [];
    return users.filter(user => user.miningActive);
  };

  const getUnverifiedUsers = (users: any[] | undefined) => {
    if (!users) return [];
    return users.filter(user => !user.emailVerified);
  };

  const allUsers = filterUsers(usersData?.(users), searchQuery);
  const activeUsers = getActiveUsers(allUsers);
  const unverifiedUsers = getUnverifiedUsers(allUsers);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, fund wallets, and view user details
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or TAI ID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Users ({allUsers?.length || 0})</TabsTrigger>
            <TabsTrigger value="active">Active Mining ({activeUsers?.length || 0})</TabsTrigger>
            <TabsTrigger value="unverified">Unverified ({unverifiedUsers?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <UsersList filterQuery={searchQuery} />
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Mining Users</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersList (property) filterQuery={searchQuery} filterActive={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="unverified" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Unverified Users</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersList filterQuery={searchQuery} filterUnverified={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
