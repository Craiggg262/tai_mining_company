import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WalletBalance } from "@/components/shared/WalletBalance";
import { MiningStatus } from "@/components/shared/MiningStatus";
import { TransactionHistory } from "@/components/shared/TransactionHistory";
import { ReferralStats } from "@/components/shared/ReferralStats";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleViewAllTransactions = () => {
    setLocation("/history");
  };

  const handleViewReferrals = () => {
    setLocation("/referral");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium">{user?.name.split(' ')[0]}</span>!
          </p>
        </div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletBalance type="tai" />
          <WalletBalance type="usdt" />
        </div>

        {/* Mining Status */}
        <div>
          <MiningStatus />
        </div>

        {/* Recent Transactions */}
        <div>
          <TransactionHistory 
            limit={5} 
            showViewAll={true} 
            onViewAll={handleViewAllTransactions} 
          />
        </div>

        {/* Referral Stats */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Referrals</h2>
            <button 
              onClick={handleViewReferrals}
              className="text-sm text-primary hover:underline"
            >
              View details
            </button>
          </div>
          <ReferralStats />
        </div>
      </div>
    </DashboardLayout>
  );
}
