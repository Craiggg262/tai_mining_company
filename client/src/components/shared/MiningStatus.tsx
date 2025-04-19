import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMiningSimulation } from "@/hooks/useMiningSimulation";
import { Hammer, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MiningStatusProps {
  detailed?: boolean;
  className?: string;
}

export function MiningStatus({ detailed = false, className }: MiningStatusProps) {
  const { miningStatus, loading, startMining, stopMining, claimReward } = useMiningSimulation();
  
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <div className={`p-4 bg-primary/20 rounded-full mr-4 ${miningStatus.active ? 'animate-pulse' : ''}`}>
              <Hammer className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Mining Status</h2>
                <Badge variant={miningStatus.active ? "default" : "outline"}>
                  {miningStatus.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground">Mining at <span className="font-medium text-primary">0.25 TAI/hr</span></p>
            </div>
          </div>
          
          {miningStatus.active ? (
            <Button 
              variant="destructive" 
              onClick={stopMining} 
              disabled={loading}
            >
              Stop Mining
            </Button>
          ) : (
            <Button 
              onClick={startMining} 
              disabled={loading}
            >
              Start Mining
            </Button>
          )}
        </div>
        
        {miningStatus.active && (
          <div className="bg-background/50 p-4 rounded-lg">
            {detailed && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <p>Session started: <span className="font-medium">{miningStatus.startTime?.toLocaleString()}</span></p>
                  <p>Duration: <span className="font-medium">{miningStatus.duration}</span></p>
                </div>
                <div className="mt-4 md:mt-0">
                  <p>Earnings this session: <span className="font-medium text-secondary">{miningStatus.sessionEarnings.toFixed(2)} TAI</span></p>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Current progress</span>
                <span>Next reward: 0.25 TAI</span>
              </div>
              <Progress value={miningStatus.currentProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span className="flex items-center">
                  <Timer className="h-3 w-3 mr-1" />
                  Next reward in {miningStatus.nextRewardIn}
                </span>
                {miningStatus.currentProgress >= 100 && (
                  <Button size="sm" variant="outline" onClick={claimReward} disabled={loading}>
                    Claim Reward
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
