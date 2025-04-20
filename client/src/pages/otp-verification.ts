import { useState, useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OTPInput } from "@/components/ui/OTPInput";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { verifyOtp } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Extract email from URL
    const params = new URLSearchParams(location.split('?')[1]);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Redirect to login if no email is provided
      setLocation('/login');
    }
  }, [location, setLocation]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleVerify = async () => {
    if (otp.length !== 6 || !email) return;
    
    setIsLoading(true);
    const result = await verifyOtp(email, otp);
    setIsLoading(false);
    
    if (result.success) {
      // Verification successful - user will be redirected by the hook
    }
  };

  const handleResendOtp = () => {
    // In a real app, we would call an API to resend the OTP
    setCanResend(false);
    setCountdown(60);
    // Reset OTP input
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-6">
            <Logo size="lg" />
            <h1 className="mt-4 text-3xl font-bold font-heading">Verify your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a code to <span className="font-medium">{email}</span>
            </p>
          </div>
          
          <div className="space-y-6">
            <OTPInput 
              length={6} 
              value={otp} 
              onChange={setOtp}
              disabled={isLoading}
              className="mx-auto"
            />
            
            <Button 
              onClick={handleVerify} 
              className="w-full" 
              disabled={otp.length !== 6 || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify"
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive a code?{' '}
                {canResend ? (
                  <Button 
                    variant="link" 
                    className="p-0" 
                    onClick={handleResendOtp}
                  >
                    Resend
                  </Button>
                ) : (
                  <span className="text-muted-foreground">
                    Resend in {countdown}s
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
