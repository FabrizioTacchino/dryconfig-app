
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserMenu from './UserMenu';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center">
          <SidebarTrigger />
        </div>
        
        <div className="flex items-center space-x-6">
          <NotificationDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
