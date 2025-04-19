import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  Home, 
  Hammer, 
  Wallet, 
  RefreshCw, 
  Download, 
  Upload, 
  Lock, 
  Users, 
  Clock, 
  LogOut, 
  LucideIcon 
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  title: string;
  path: string;
  icon: LucideIcon;
  active: boolean;
}

function NavItem({ title, path, icon: Icon, active }: NavItemProps) {
  const [, setLocation] = useLocation();
  
  return (
    <Button 
      variant={active ? "default" : "ghost"} 
      className="w-full justify-start"
      onClick={() => setLocation(path)}
    >
      <Icon className="mr-2 h-5 w-5" />
      {title}
    </Button>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
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
  
  return (
    <aside className={cn("w-64 flex flex-col border-r", className)}>
      <div className="p-4 border-b">
        <Logo size="sm" />
      </div>
      
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.path}
              title={item.title}
              path={item.path}
              icon={getIcon(item.icon)}
              active={location === item.path}
            />
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t">
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
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
