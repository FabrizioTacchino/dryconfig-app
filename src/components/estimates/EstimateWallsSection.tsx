
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EstimateWall } from '@/types/estimate';
import EstimateWallsTable from './EstimateWallsTable';

interface EstimateWallsSectionProps {
  walls: EstimateWall[];
  onUpdateWall: (wallData: any) => void;
  onDeleteWall: (wallId: string) => void;
  onAddWall: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const EstimateWallsSection = ({
  walls,
  onUpdateWall,
  onDeleteWall,
  onAddWall,
  isUpdating,
  isDeleting,
}: EstimateWallsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pareti del Preventivo</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestisci le pareti e i relativi costi
            </p>
          </div>
          <Button onClick={onAddWall}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Parete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <EstimateWallsTable
          walls={walls}
          onUpdateWall={onUpdateWall}
          onDeleteWall={onDeleteWall}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      </CardContent>
    </Card>
  );
};

export default EstimateWallsSection;
