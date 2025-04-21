import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({ 
  length = 6, 
  value = "", 
  onChange, 
  disabled = false,
  className
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize ref array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Update local OTP state when value prop changes
  useEffect(() => {
    const valueArray = value.split("").slice(0, length);
    const newOtp = [...Array(length).fill("")];
    
    valueArray.forEach((char, index) => {
      newOtp[index] = char;
    });
    
    setOtp(newOtp);
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    
    // Only accept single digits
    if (!/^\d*$/.test(newValue)) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    
    // Handle paste event or multiple characters
    if (newValue.length > 1) {
      const otpArray = newValue.split("").slice(0, length - index);
      
      // Fill current and next inputs
      otpArray.forEach((char, i) => {
        if (index + i < length) {
          newOtp[index + i] = char;
        }
      });
      
      // Focus on the next empty input or the last one
      const nextIndex = Math.min(index + otpArray.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single character input
      newOtp[index] = newValue;
      
      // Auto-focus next input if available
      if (newValue && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    
    setOtp(newOtp);
    onChange(newOtp.join(""));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move focus to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Move focus on arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedDigits = pastedData.replace(/\D/g, "").slice(0, length);
    
    if (!pastedDigits) return;
    
    const newOtp = [...Array(length).fill("")];
    pastedDigits.split("").forEach((char, index) => {
      newOtp[index] = char;
    });
    
    setOtp(newOtp);
    onChange(newOtp.join(""));
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = pastedDigits.length < length ? pastedDigits.length : length - 1;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  return (
    <div className={cn("flex justify-center space-x-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          className="w-12 h-12 text-center text-xl font-bold rounded-md"
          value={otp[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          maxLength={1}
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
        />
      ))}
    </div>
  );
}
