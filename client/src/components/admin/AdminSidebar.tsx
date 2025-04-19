import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  X, 
  LucideIcon 
} from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";

interface AdminSidebarProps {
  className?: string;
  closeSidebar?: () => void;
}

interface NavItemProps {
  title: string;
  path: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ title, path, icon: Icon, active, onClick }: NavItemProps) {
  const [, setLocation] = useLocation();
  
  const handleClick = () => {
    setLocation(path);
    if (onClick) onClick();
  };
  
  return (
    <Button 
      variant={active ? "default" : "ghost"} 
      className="w-full justify-start"
      onClick={handleClick}
    >
      <Icon className="mr-2 h-5 w-5" />
      {title}
    </Button>
  );
}

export function AdminSidebar({ className, closeSidebar }: AdminSidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const getIcon = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      'layout-dashboard': LayoutDashboard,
      'users': Users,
      'credit-card': CreditCard,
      'settings': Settings
    };
    
    return icons[iconName] || LayoutDashboard;
  };
  
  const handleLogout = () => {
    if (closeSidebar) closeSidebar();
    logout();
  };
  
  return (
    <aside className={cn("flex flex-col border-r", className)}>
      <div className="p-4 border-b flex items-center justify-between">
        <Logo size="sm" />
        {closeSidebar && (
          <Button variant="ghost" size="icon" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.path}
              title={item.title}
              path={item.path}
              icon={getIcon(item.icon)}
              active={location === item.path}
              onClick={closeSidebar}
            />
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback>{user ? getInitials(user.name) : "A"}</AvatarFallback>
          </Avatar>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
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
      </div>
    </aside>
  );
}
