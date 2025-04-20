import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Users, Wallet, CreditCard, Activity } from "lucide-react";
import users from "./users";
import { Stats } from "fs";
import { withdrawals } from "@shared/schema";

interface SystemStats {
  totalUsers: number;
  totalTaiBalance: number;
  totalUsdtBalance: number;
  totalPendingWithdrawals: number;
  totalActiveStakings: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [chartColors] = useState({
    users: "#7F5AF0",
    tai: "#2EC76D",
    usdt: "#F5A623",
    withdrawals: "#F24E1E"
  });

  // Fetch system stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats', user?.id],
    enabled: !!user
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users', user?.id],
    enabled: !!user
  });

  // Fetch pending withdrawals
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['/api/admin/withdrawals', user?.id],
    enabled: !!user
  });

  // Generate daily stats for chart (simulated data based on actual stats)
  useEffect(() => {
    if (statsData?.(stats)) {
      const now = new Date();
      const stats = statsData.stats as SystemStats;
      const baseData = {
        users: stats.totalUsers,
        tai: stats.totalTaiBalance,
        usdt: stats.totalUsdtBalance,
        withdrawals: stats.totalPendingWithdrawals
      };

      // Generate data for the last 7 days
      const data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(now.getDate() - (6 - i));
        
        // Apply some variation to simulate daily changes
        const variation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        const dayFactor = 0.7 + (i * 0.05); // Growth factor
        
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          users: Math.floor(baseData.users * dayFactor * variation * 0.9),
          tai: Math.floor(baseData.tai * dayFactor * variation * 0.9),
          usdt: Math.floor(baseData.usdt * dayFactor * variation * 0.9),
          withdrawals: Math.floor(baseData.withdrawals * dayFactor * variation * 0.9)
        };
      });

      // Last day is current actual stats
      data[6] = {
        ...data[6],
        users: baseData.users,
        tai: baseData.tai,
        usdt: baseData.usdt,
        withdrawals: baseData.withdrawals
      };

      setDailyStats(data);
    }
  }, [statsData]);

  // Prepare data for currency distribution pie chart
  const prepareCurrencyDistribution = () => {
    if (!statsData?.(stats )) [];
    
    const stats = statsData.stats as SystemStats;
    const total = stats.totalTaiBalance + stats.totalUsdtBalance;
    
    return [
      { name: 'TAI', value: stats.totalTaiBalance, percentage: Math.round((stats.totalTaiBalance / total) * 100) },
      { name: 'USDT', value: stats.totalUsdtBalance, percentage: Math.round((stats.totalUsdtBalance / total) * 100) }
    ];
  };

  const pendingWithdrawalsAmount = () => {
    if (!withdrawalsData?.(withdrawals)) return 0;
    
    return withdrawalsData.withdrawals.reduce((sum: number, w: any) => {
      return sum + (w.amount || 0);
    }, 0);
  };

  const renderStat = (title: string, value: string | number, icon: React.ReactNode, isLoading: boolean) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            )}
          </div>
          <div className="p-3 bg-primary/20 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const stats = statsData?.stats as SystemStats | undefined;
  const currencyDistribution = prepareCurrencyDistribution();
  const COLORS = ['#7F5AF0', '#F5A623'];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-6">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderStat(
              "Total Users",
              stats?.totalUsers || 0,
              <Users className="h-6 w-6 text-primary" />,
              isLoadingStats
            )}
            {renderStat(
              "TAI Balance",
              stats ? `${stats.totalTaiBalance.toLocaleString()} TAI` : "0 TAI",
              <Wallet className="h-6 w-6 text-secondary" />,
              isLoadingStats
            )}
            {renderStat(
              "USDT Balance",
              stats ? `${stats.totalUsdtBalance.toLocaleString()} USDT` : "0 USDT",
              <Wallet className="h-6 w-6 text-warning" />,
              isLoadingStats
            )}
            {renderStat(
              "Pending Withdrawals",
              stats?.totalPendingWithdrawals || 0,
              <CreditCard className="h-6 w-6 text-destructive" />,
              isLoadingStats
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>System Growth</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={dailyStats}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill={chartColors.users} name="Users" />
                    <Bar dataKey="tai" fill={chartColors.tai} name="TAI (K)" />
                    <Bar dataKey="usdt" fill={chartColors.usdt} name="USDT (K)" />
                    <Bar dataKey="withdrawals" fill={chartColors.withdrawals} name="Withdrawals" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={currencyDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {currencyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 space-y-2 w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-sm">TAI Balance</span>
                      </div>
                      <span className="font-medium">{stats?.totalTaiBalance.toLocaleString() || 0} TAI</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-warning mr-2"></div>
                        <span className="text-sm">USDT Balance</span>
                      </div>
                      <span className="font-medium">{stats?.totalUsdtBalance.toLocaleString() || 0} USDT</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm font-medium">Pending Withdrawals Value</span>
                      <span className="font-medium">{pendingWithdrawalsAmount().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-background/50 p-4 rounded-md">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="text-sm font-medium">Active Mining Sessions</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingUsers ? <Skeleton className="h-8 w-20" /> : (
                    usersData?.(user)?.filter((u: any) => u.miningActive).length || 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users currently mining
                </p>
              </div>
              
              <div className="bg-background/50 p-4 rounded-md">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="text-sm font-medium">Pending Withdrawals</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingWithdrawals ? <Skeleton className="h-8 w-20" /> : (
                    withdrawalsData?.withdrawals?.length || 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requiring approval
                </p>
              </div>
              
              <div className="bg-background/50 p-4 rounded-md">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="text-sm font-medium">Active Stakings</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingStats ? <Skeleton className="h-8 w-20" /> : (
                    stats?.totalActiveStakings || 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ongoing staking positions
                </p>
              </div>
              
              <div className="bg-background/50 p-4 rounded-md">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <h3 className="text-sm font-medium">Verified Users</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingUsers ? <Skeleton className="h-8 w-20" /> : (
                    usersData?.(users)?.filter((u: any) => u.emailVerified).length || 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Lock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
