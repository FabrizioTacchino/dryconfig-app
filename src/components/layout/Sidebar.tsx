
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Wrench, 
  Package,
  Shield
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useUserRole();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Progetti',
      href: '/projects',
      icon: FolderOpen,
    },
    {
      name: 'Configuratore',
      href: '/configurator',
      icon: Wrench,
    },
    {
      name: 'Materiali',
      href: '/materials',
      icon: Package,
    },
    ...(isAdmin ? [{
      name: 'Amministrazione',
      href: '/admin',
      icon: Shield,
    }] : []),
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
      <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-gray-200 bg-white px-4 pb-4">
        <div className="flex h-14 shrink-0 items-center justify-center py-3">
          <Logo size={28} />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-5">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        location.pathname === item.href
                          ? 'bg-construction-primary text-white'
                          : 'text-gray-700 hover:text-construction-primary hover:bg-gray-50',
                        'group flex gap-x-2 rounded-md p-2 text-sm leading-5 font-medium'
                      )}
                    >
                      <item.icon
                        className={cn(
                          location.pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-construction-primary',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
