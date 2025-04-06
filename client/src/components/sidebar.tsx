import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Bell,
  FileText,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
  CheckSquare,
  AlertTriangle,
  Mail,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ className, isMobileOpen, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Handle mobile sidebar close on navigation
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [location, isMobileOpen, onMobileClose]);

  // Determine if sidebar should be shown based on mobile state and collapsed state
  const showSidebar = isMobileOpen !== false;

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full w-64 transform bg-gradient-to-b from-blue-50 to-white shadow-md transition-all duration-300 md:relative md:z-0",
          collapsed && "w-16",
          !showSidebar && "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Logo and collapse button */}
        <div className="flex h-16 items-center justify-between border-b bg-primary/10 px-4">
          {!collapsed && (
            <span className="text-xl font-semibold text-primary">Compliance Hub</span>
          )}
          {collapsed && (
            <span className="mx-auto text-xl font-semibold text-primary">CH</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
          >
            <ChevronLeft size={18} />
          </Button>
        </div>

        {/* Navigation links */}
        <nav className="py-4">
          <div className="space-y-1 px-2">
            <Link 
              href="/"
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                isActive("/") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
              )}
            >
              <LayoutDashboard className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
              {!collapsed && <span>Dashboard</span>}
            </Link>

            <Link 
              href="/tasks"
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                isActive("/tasks") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
              )}
            >
              <CheckSquare className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
              {!collapsed && <span>Tasks</span>}
            </Link>

            <Link 
              href="/notifications"
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                isActive("/notifications") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
              )}
            >
              <Bell className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
              {!collapsed && <span>Notifications</span>}
            </Link>

            {/* Admin-only section */}
            {user?.role === 'admin' && (
              <>
                <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase">
                  {!collapsed && "Admin Settings"}
                </div>

                <Link 
                  href="/escalation-management"
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                    isActive("/escalation-management") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                  )}
                >
                  <AlertTriangle className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
                  {!collapsed && <span>Escalation Levels</span>}
                </Link>

                <Link 
                  href="/notification-templates"
                  className={cn(
                    "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                    isActive("/notification-templates") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                  )}
                >
                  <Mail className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
                  {!collapsed && <span>Message Templates</span>}
                </Link>
              </>
            )}

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase">
              {!collapsed && "User Settings"}
            </div>

            <Link 
              href="/settings"
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                isActive("/settings") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
              )}
            >
              <Settings className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
              {!collapsed && <span>Settings</span>}
            </Link>

            <Link 
              href="/profile"
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors",
                isActive("/profile") && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
              )}
            >
              <User className={cn("mr-3", collapsed ? "mr-0 mx-auto" : "mr-3")} size={20} />
              {!collapsed && <span>Profile</span>}
            </Link>
          </div>
        </nav>

        {/* Logout button at bottom */}
        <div className="absolute bottom-0 w-full border-t p-4">
          <Button
            variant="ghost"
            className={cn(
              "flex w-full items-center justify-center text-gray-700 hover:bg-blue-50",
              collapsed && "px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("mr-2", collapsed ? "mr-0" : "mr-2")} size={20} />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}>
      <Menu size={20} />
    </Button>
  );
}
