
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MaterialSelector from './MaterialSelector';
import { useMaterials } from '@/hooks/useMaterials';

interface MaterialsTabProps {
  selectedMaterials: Record<string, string[]>;
  onMaterialSelection: (category: string, id: string, selected: boolean) => void;
}

const MaterialsTab = ({ selectedMaterials, onMaterialSelection }: MaterialsTabProps) => {
  const { data: allMaterials = [], isLoading: isLoadingMaterials } = useMaterials();

  if (isLoadingMaterials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selezione materiali</CardTitle>
          <CardDescription>
            Scegli i materiali da utilizzare nella stratigrafia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-muted-foreground">Caricamento materiali...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selezione materiali</CardTitle>
        <CardDescription>
          Scegli i materiali da utilizzare nella stratigrafia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MaterialSelector
          selectedIds={selectedMaterials.board || []}
          onSelect={(id, selected) => onMaterialSelection('board', id, selected)}
          category="board"
        />
        
        <MaterialSelector
          selectedIds={selectedMaterials.structure_frame || []}
          onSelect={(id, selected) => onMaterialSelection('structure_frame', id, selected)}
          category="structure_frame"
        />
        
        <MaterialSelector
          selectedIds={selectedMaterials.structure_guide || []}
          onSelect={(id, selected) => onMaterialSelection('structure_guide', id, selected)}
          category="structure_guide"
        />
        
        <MaterialSelector
          selectedIds={selectedMaterials.insulation || []}
          onSelect={(id, selected) => onMaterialSelection('insulation', id, selected)}
          category="insulation"
        />

        <MaterialSelector
          selectedIds={selectedMaterials.accessory || []}
          onSelect={(id, selected) => onMaterialSelection('accessory', id, selected)}
          category="accessory"
        />

        <MaterialSelector
          selectedIds={selectedMaterials.screw || []}
          onSelect={(id, selected) => onMaterialSelection('screw', id, selected)}
          category="screw"
        />
      </CardContent>
    </Card>
  );
};

export default MaterialsTab;
