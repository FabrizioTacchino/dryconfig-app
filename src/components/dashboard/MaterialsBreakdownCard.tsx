
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { Badge } from '@/components/ui/badge';

interface MaterialBreakdownItem {
  category: string;
  totalCost: number;
  percentage: number;
  items: number;
}

interface MaterialsBreakdownCardProps {
  data: MaterialBreakdownItem[];
  totalCost: number;
  className?: string;
}

export const MaterialsBreakdownCard: React.FC<MaterialsBreakdownCardProps> = ({
  data,
  totalCost,
  className
}) => {
  const categoryColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
    'board': 'primary',
    'structure_frame': 'secondary',
    'structure_guide': 'secondary',
    'insulation': 'success',
    'accessory': 'warning',
    'screw': 'primary'
  };

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardHeader>
        <CardTitle>Breakdown Materiali</CardTitle>
        <CardDescription>
          Distribuzione costi per categoria - Totale: €{totalCost.toLocaleString('it-IT')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.category} className="space-y-2" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">
                  {item.category.replace('_', ' ')}
                </span>
                <Badge variant="outline" className="text-xs">
                  {item.items} elementi
                </Badge>
              </div>
              <div className="text-right">
                <div className="font-semibold">€{item.totalCost.toLocaleString('it-IT')}</div>
                <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
            <AnimatedProgress
              value={item.percentage}
              max={100}
              color={categoryColors[item.category] || 'primary'}
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
