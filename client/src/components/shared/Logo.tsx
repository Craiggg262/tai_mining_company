import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}

export function Logo({ size = "md", withText = true, className }: LogoProps) {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8";
      case "lg":
        return "h-16 w-16";
      case "md":
      default:
        return "h-12 w-12";
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(getSizeClass(), "rounded-full bg-primary/20 flex items-center justify-center")}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className={cn("text-primary", size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.5 7L11 9.5L5.5 15L4 12.5L9.5 7Z" />
          <path d="M14.5 17L13 14.5L18.5 9L20 11.5L14.5 17Z" />
          <circle cx="8" cy="8" r="2" />
          <circle cx="16" cy="16" r="2" />
          <path d="M3 10H7" />
          <path d="M17 10H21" />
          <path d="M10 3V7" />
          <path d="M10 17V21" />
          <path d="M14 3V7" />
          <path d="M14 17V21" />
        </svg>
      </div>
      {withText && (
        <span className={cn(
          "font-heading font-bold ml-2", 
          size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl"
        )}>
          Tai Mining
        </span>
      )}
    </div>
  );
}
