
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  description?: string;
  value: string | number | React.ReactNode;
  change?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  className?: string;
  animated?: boolean;
  children?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  value,
  change,
  icon,
  className,
  animated = true,
  children
}) => {
  const changeColor = change?.type === 'positive' ? 'text-green-600' : 
                    change?.type === 'negative' ? 'text-red-600' : 
                    'text-gray-600';

  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-300",
        animated && "animate-fade-in hover:scale-105",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
        </div>
        {description && (
          <CardDescription className="mb-2">{description}</CardDescription>
        )}
        {change && (
          <p className={cn("text-xs", changeColor)}>
            {change.value > 0 ? '+' : ''}{change.value.toFixed(1)}%
            {change.label && ` ${change.label}`}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
