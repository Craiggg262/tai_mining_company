import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ReferralStats } from "@/components/shared/ReferralStats";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2, CheckCircle2, Users } from "lucide-react";
import { copyToClipboard, formatDateShort } from "@/lib/utils";
import { REFERRAL_BONUS, REFERRAL_SVG } from "@/lib/constants";

export default function Referral() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch referral data
  const { data: referralsData, isLoading } = useQuery({
    queryKey: ['/api/referrals', user?.id],
    enabled: !!user,
  });

  const handleCopyReferralLink = async () => {
    if (!user) return;
    
    const referralUrl = `${window.location.origin}/signup?ref=${user.referralCode}`;
    const success = await copyToClipboard(referralUrl);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Referral Link Copied",
        description: "Share it with friends to earn TAI rewards",
      });
    }
  };

  const handleShare = async () => {
    if (!user) return;
    
    const referralUrl = `${window.location.origin}/signup?ref=${user.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Tai Mining Platform',
          text: 'Sign up using my referral link and start mining TAI!',
          url: referralUrl,
        });
        
        toast({
          title: "Shared Successfully",
          description: "Your referral link has been shared",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyReferralLink();
    }
  };
  interface ReferralStatsData {
    totalReferrals: number;
    activeReferrals: number;
    earnings: number;
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Referral Program</h1>
          <p className="text-muted-foreground">
            Invite friends and earn {REFERRAL_BONUS} TAI for each referral
          </p>
        </div>

        {/* Referral Stats */}
        <ReferralStats />

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link to earn {REFERRAL_BONUS} TAI for each new user who signs up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex md:flex-row flex-col gap-4 md:items-center">
              <div className="flex-grow">
                <div className="relative">
                  <Input
                    readOnly
                    value={user ? `${window.location.origin}/signup?ref=${user.referralCode}` : "Loading..."}
                    className="pr-12 font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={handleCopyReferralLink}
                  >
                    {copied ? 
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                      <Copy className="h-4 w-4" />
                    }
                  </Button>
                </div>
                {user && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Your referral code: <span className="font-medium">{user.referralCode}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 md:w-auto w-full">
                <Button
                  variant="outline"
                  className="flex-1 md:flex-initial"
                  onClick={handleCopyReferralLink}
                >
                  <Copy className="mr-2 h-4 w-4" /> 
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  className="flex-1 md:flex-initial"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>
            
            <div className="flex md:flex-row flex-col items-center gap-6 border-t pt-6">
              <div 
                className="w-32 h-32 flex-shrink-0" 
                dangerouslySetInnerHTML={{ __html: REFERRAL_SVG }}
              ></div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">How It Works</h3>
                <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                  <li>Share your unique referral link with friends</li>
                  <li>When they sign up and verify their email, you'll receive {REFERRAL_BONUS} TAI</li>
                  <li>There's no limit to how many friends you can invite</li>
                  <li>Track your referrals and earnings on this page</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <div className="flex justify-center">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              
                : referralsData?.referrals?.length === 0 ? (
                  referralsData.referrals.map((referral.any)  (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.name}</TableCell>
                      <TableCell>{formatDateSchort(referral.createdAt)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          referral.miningActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {referral.miningActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-secondary">+{REFERRAL_BONUS} TAI</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="space-y-3">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
                        <p className="text-muted-foreground">You haven't referred anyone yet</p>
                        <Button size="sm" onClick={handleShare}>
                          <Share2 className="mr-2 h-4 w-4" /> Share Your Link
                        </Button>
                      </div>
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
