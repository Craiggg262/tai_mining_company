import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Coins } from "lucide-react";
import { any } from "zod";

interface ReferralStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function ReferralStat({ title, value, icon }: ReferralStatProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="p-3 bg-primary/20 rounded-full inline-block mb-2">
            {icon}
          </div>
          <h3 className="text-2xl font-bold">
            {value}
          </h3>
          <p className="text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReferralStatsProps {
  className?: string;
}

export function ReferralStats({ className }: ReferralStatsProps) {
  const { user } = useAuth();
  
  const { isLoading } = useQuery <ReferralStatsData>({
    queryKey: ['/api/referrals', user?.id],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-primary/20 rounded-full inline-block mb-2">
                  <Skeleton className="h-6 w-6" />
                </div>
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  interface ReferralStatsData {
    totalReferrals: number;
    activeReferrals: number;
    earnings: number;
  }  
  const {data} = useQuery<ReferralStatsData>("referralStat", fetchReferralStat);



    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      <StatCard title="Total Referrals" value={data?.totalReferrals || 0} />
<StatCard title="Active Referrals" value={data?.activeReferrals || 0} />
<StatCard title="Referral Earnings" value={(data?.earnings || 0)}>toFixed(2)/</StatCard>

    </div>

}
