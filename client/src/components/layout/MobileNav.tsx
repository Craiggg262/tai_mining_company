import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Menu, X, Home, Hammer, Wallet, RefreshCw, Download, Upload, Lock, Users, Clock, LogOut, LucideIcon } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  const getIcon = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      'home': Home,
      'hammer': Hammer,
      'wallet': Wallet,
      'refresh-cw': RefreshCw,
      'download': Download,
      'upload': Upload,
      'lock': Lock,
      'users': Users,
      'clock': Clock
    };
    
    return icons[iconName] || Home;
  };
  
  const handleNavigation = (path: string) => {
    setLocation(path);
    setOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    setOpen(false);
  };
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between p-4 border-b md:hidden">
        <Logo size="sm" />
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Menu</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = getIcon(item.icon);
                const isActive = location === item.path;
                
                return (
                  <Button 
                    key={item.path}
                    variant={isActive ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.title}
                  </Button>
                );
              })}
            </div>
          </nav>
          
          <SheetFooter className="p-4 mt-auto border-t">
            <div className="flex items-center">
              <Avatar>
                <AvatarFallback>{user ? getInitials(user.name) : "UM"}</AvatarFallback>
              </Avatar>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="ml-auto" 
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
