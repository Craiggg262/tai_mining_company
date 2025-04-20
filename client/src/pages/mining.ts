import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MiningStatus } from "@/components/shared/MiningStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CalendarCheck, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatDateShort, formatTimeDuration } from "@/lib/utils";

interface MiningSession {
  date: string;
  duration: string;
  earnings: number;
  status: string;
}

export default function Mining() {
  const { user } = useAuth();
  const [miningStats, setMiningStats] = useState({
    today: 0,
    week: 0,
    month: 0
  });

  // This would be a real API call in a production app
  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    enabled: !!user
  });

  useEffect(() => {
    // Calculate mining stats from transactions
    if (transactions?.transactions) {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setDate(1);

      const miningRewards = transactions.filter(
        (tx: any) => tx.type === 'mining_reward'
      );

      const todayRewards = miningRewards.filter(
        (tx: any) => new Date(tx.createdAt) >= today
      );

      const weekRewards = miningRewards.filter(
        (tx: any) => new Date(tx.createdAt) >= weekStart
      );

      const monthRewards = miningRewards.filter(
        (tx: any) => new Date(tx.createdAt) >= monthStart
      );

      setMiningStats({
        today: todayRewards.reduce((sum: number, tx: any) => sum + tx.amount, 0),
        week: weekRewards.reduce((sum: number, tx: any) => sum + tx.amount, 0),
        month: monthRewards.reduce((sum: number, tx: any) => sum + tx.amount, 0)
      });
    }
  }, [transactions]);

  // Generate mining history for display
  // In a real app, this would come from the API
  const miningHistory: MiningSession[] = transactions?.(transactions)
    ? transactions.transactions
      .filter((tx: any) => tx.type === 'mining_reward')
      .slice(0, 10)
      .map((tx: any) => ({
        date: tx.createdAt,
        duration: tx.description.includes('for') 
          ? tx.description.split('for ')[1] 
          : '1h 0m',
        earnings: tx.amount,
        status: tx.status
      }))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Mining</h1>
          <p className="text-muted-foreground">
            Earn Tai by mining with your device
          </p>
        </div>

        {/* Mining Status */}
        <MiningStatus detailed={true} />

        {/* Mining Statistics */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Mining Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="p-3 bg-primary/20 rounded-full inline-block mb-2">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{miningStats.today.toFixed(2)}</h3>
                  <p className="text-muted-foreground">Today (TAI)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="p-3 bg-warning/20 rounded-full inline-block mb-2">
                    <Calendar className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="text-2xl font-bold">{miningStats.week.toFixed(2)}</h3>
                  <p className="text-muted-foreground">This Week (TAI)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="p-3 bg-secondary/20 rounded-full inline-block mb-2">
                    <CalendarCheck className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold">{miningStats.month.toFixed(2)}</h3>
                  <p className="text-muted-foreground">This Month (TAI)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mining History */}
        <Card>
          <CardHeader>
            <CardTitle>Mining History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miningHistory.length > 0 ? (
                  miningHistory.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDateShort(session.date)}</TableCell>
                      <TableCell className="text-muted-foreground">{session.duration}</TableCell>
                      <TableCell className="font-medium text-secondary">{session.earnings.toFixed(2)} TAI</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary/20 text-secondary">
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No mining history yet. Start mining to earn TAI!
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
