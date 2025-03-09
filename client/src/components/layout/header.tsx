import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const userInitials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() 
    : 'U';

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4 shadow-sm">
      <div className="flex md:hidden">
        <Button variant="ghost" size="icon" onClick={onMobileMenuToggle}>
          <Menu className="h-6 w-6 text-gray-600" />
        </Button>
      </div>
      
      <div className="flex items-center flex-1 px-4">
        <div className="relative md:w-1/3">
          <Input
            type="text"
            placeholder="Search tenders, bidders..."
            className="w-full h-10 pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-700 hidden md:inline-block">
                {user?.fullName}
              </span>
              <Avatar>
                <AvatarFallback className="bg-primary-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
