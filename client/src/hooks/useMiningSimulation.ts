import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MINING_RATE_PER_HOUR } from '@/lib/constants';
import { formatTimeDuration } from '@/lib/utils';

export function useMiningSimulation() {
  const { user, updateUser } = useAuth();
  const [miningStatus, setMiningStatus] = useState<{
    active: boolean;
    startTime: Date | null;
    duration: string;
    currentProgress: number;
    nextRewardIn: string;
    sessionEarnings: number;
  }>({
    active: false,
    startTime: null,
    duration: '0h 0m',
    currentProgress: 0,
    nextRewardIn: '01:00:00',
    sessionEarnings: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize mining status from user data
  useEffect(() => {
    if (user) {
      const isActive = user.miningActive || false;
      const startTime = user.lastMiningAt ? new Date(user.lastMiningAt) : null;
      
      setMiningStatus({
        active: isActive,
        startTime,
        duration: '0h 0m',
        currentProgress: 0,
        nextRewardIn: '01:00:00',
        sessionEarnings: 0,
      });
    }
  }, [user]);

  // Update mining progress every second when active
  useEffect(() => {
    if (!miningStatus.active || !miningStatus.startTime) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const startTime = miningStatus.startTime!;
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;
      
      // Calculate progress toward next reward (resets every hour)
      const minutesSinceLastHour = minutes;
      const progress = (minutesSinceLastHour / 60) * 100;
      
      // Calculate time until next reward
      const minutesLeft = 60 - minutesSinceLastHour;
      const secondsLeft = 60 - (now.getSeconds());
      const nextRewardIn = `${String(Math.floor(minutesLeft / 60)).padStart(2, '0')}:${String(minutesLeft % 60).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
      
      // Estimate earnings this session
      const sessionEarnings = hours * MINING_RATE_PER_HOUR;
      
      setMiningStatus(prev => ({
        ...prev,
        duration: formatTimeDuration(elapsedMinutes),
        currentProgress: progress,
        nextRewardIn,
        sessionEarnings,
      }));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [miningStatus.active, miningStatus.startTime]);

  const startMining = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/mining/start', { userId: user.id });
      const data = await response.json();
      
      // Update user and mining status
      updateUser({
        ...user,
        miningActive: true,
        lastMiningAt: data.startTime,
      });
      
      setMiningStatus({
        active: true,
        startTime: new Date(data.startTime),
        duration: '0h 0m',
        currentProgress: 0,
        nextRewardIn: '01:00:00',
        sessionEarnings: 0,
      });
      
      toast({
        title: "Mining Started",
        description: "You are now mining at 0.25 TAI per hour.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Start mining error:', error);
      toast({
        title: "Mining Failed to Start",
        description: error.message || "Could not start mining",
        variant: "destructive",
      });
      
      return { error: error.message || "Mining failed to start" };
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, toast]);

  const stopMining = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/mining/stop', { userId: user.id });
      const data = await response.json();
      
      // Update user and mining status
      updateUser({
        ...user,
        miningActive: false,
        lastMiningAt: null,
        taiBalance: user.taiBalance + data.reward,
      });
      
      setMiningStatus({
        active: false,
        startTime: null,
        duration: '0h 0m',
        currentProgress: 0,
        nextRewardIn: '01:00:00',
        sessionEarnings: 0,
      });
      
      toast({
        title: "Mining Stopped",
        description: `You earned ${data.reward.toFixed(2)} TAI during this session.`,
      });
      
      return { success: true, reward: data.reward, duration: data.duration };
    } catch (error: any) {
      console.error('Stop mining error:', error);
      toast({
        title: "Mining Failed to Stop",
        description: error.message || "Could not stop mining",
        variant: "destructive",
      });
      
      return { error: error.message || "Mining failed to stop" };
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, toast]);

  const claimReward = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/mining/reward', { userId: user.id });
      const data = await response.json();
      
      // Update user balance
      updateUser({
        ...user,
        taiBalance: user.taiBalance + data.reward,
        lastMiningAt: new Date().toISOString(),
      });
      
      // Reset progress
      setMiningStatus(prev => ({
        ...prev,
        currentProgress: 0,
        nextRewardIn: '01:00:00',
      }));
      
      toast({
        title: "Reward Claimed",
        description: `You received ${data.reward.toFixed(2)} TAI as mining reward.`,
      });
      
      return { success: true, reward: data.reward };
    } catch (error: any) {
      console.error('Claim reward error:', error);
      toast({
        title: "Failed to Claim Reward",
        description: error.message || "Could not claim mining reward",
        variant: "destructive",
      });
      
      return { error: error.message || "Failed to claim reward" };
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, toast]);

  return {
    miningStatus,
    loading,
    startMining,
    stopMining,
    claimReward,
  };
}
