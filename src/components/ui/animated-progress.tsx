
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  label,
  color = 'primary'
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary', 
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">{value.toLocaleString('it-IT')}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            colorClasses[color],
            barClassName
          )}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
    </div>
  );
};
