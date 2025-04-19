import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useRoute } from 'wouter';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  taiBalance: number;
  usdtBalance: number;
  referralCode: string;
  taiId: string;
  emailVerified: boolean;
  createdAt: string;
  miningActive: boolean;
  lastMiningAt: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setLocation] = useLocation();
  const [isOnAdminRoute] = useRoute('/admin*');
  const { toast } = useToast();

  const loadUserFromStorage = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      
      if (data.requiresOtp) {
        setLoading(false);
        return { requiresOtp: true, email };
      }
      
      updateUser(data.user);
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/dashboard');
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Tai Mining Platform!",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      
      return { error: error.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  }, [setLocation, toast, updateUser]);

  const register = useCallback(async (name: string, email: string, password: string, confirmPassword: string, referralCode?: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/register', { 
        name, 
        email, 
        password, 
        confirmPassword,
        referralCode
      });
      
      const data = await response.json();
      
      // Update user data and redirect to dashboard
      updateUser(data.user);
      setLocation('/dashboard');
      
      toast({
        title: "Registration Successful",
        description: "Welcome to the platform! You can start mining now.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      
      return { error: error.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  }, [toast, updateUser, setLocation]);



  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/reset-password', { email });
      const data = await response.json();
      
      toast({
        title: "Reset Password",
        description: data.message,
      });
      
      return { success: true, email: data.email };
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Could not send reset code",
        variant: "destructive",
      });
      
      return { error: error.message || "Reset failed" };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    setLocation(isOnAdminRoute ? '/admin/login' : '/login');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  }, [setLocation, isOnAdminRoute, toast]);

  const updateBalance = useCallback((taiBalance: number, usdtBalance: number) => {
    if (user) {
      const updatedUser = { ...user, taiBalance, usdtBalance };
      updateUser(updatedUser);
    }
  }, [user, updateUser]);

  return {
    user,
    loading,
    login,
    register,
    resetPassword,
    logout,
    updateUser,
    updateBalance,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
  };
}
