import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MobileSidebarTrigger } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BellIcon, HelpCircle, Settings, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import samartiLogo from '../assets/samarti_logo.png';

interface HeaderProps {
  onMobileMenuClick: () => void;
  title?: string;
}

export function Header({ onMobileMenuClick, title = "Dashboard" }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Get notification count (unread notifications)
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications?.filter(n => n.status === 'pending' || n.status === 'sent').length || 0;

  // Get initials from user's full name
  const getInitials = () => {
    if (!user?.fullName) return 'U';
    return user.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white h-16 flex items-center justify-between px-4 border-b shadow-sm sticky top-0 z-10">
      <div className="flex items-center">
        <MobileSidebarTrigger onClick={onMobileMenuClick} />
        <div className="flex items-center">
          <img src={samartiLogo} alt="Samarti Logo" className="h-8 mr-3" />
          <h1 className="text-xl font-medium text-gray-800">{title}</h1>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="h-5 w-5 text-gray-500" />
        </Button>
        
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="h-5 w-5 text-gray-500" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-primary text-white w-5 h-5 flex items-center justify-center p-0 text-xs font-medium rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
