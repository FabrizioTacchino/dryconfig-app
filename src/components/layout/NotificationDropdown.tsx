
import React from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const NotificationDropdown = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: it 
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifiche</h4>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Segna tutte come lette
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Caricamento...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Nessuna notifica</p>
              <p className="text-xs text-muted-foreground">
                Le tue notifiche appariranno qui quando disponibili
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    !notification.read 
                      ? 'bg-muted/50 border-primary/20' 
                      : 'bg-background hover:bg-muted/20'
                  }`}
                >
                  <div className="flex space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getTypeColor(notification.type)}`}></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
