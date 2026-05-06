
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { MaterialCategory } from '@/types';
import { calculateTotalThicknessExcludingGuides } from '../utils/stratigraphyUtils';

interface Layer {
  id: string;
  materialId: string;
  material?: any;
  thickness: number;
  position: number;
  category: MaterialCategory;
  interAxis?: number;
}

interface CertificationCalculatedFieldsCardProps {
  layers: Layer[];
}

// Helper function to extract width from material description
const extractWidthFromDescription = (description: string): number | null => {
  if (!description) return null;
  
  // Look for dimension patterns like "Dimensione: 51x50x47" or "51x50x47"
  const dimensionPatterns = [
    /Dimensione:\s*(\d+)x(\d+)x(\d+)/i,
    /Dimensioni:\s*(\d+)x(\d+)x(\d+)/i,
    /(\d+)x(\d+)x(\d+)\s*mm/i,
    /(\d+)x(\d+)x(\d+)/i,
  ];
  
  for (const pattern of dimensionPatterns) {
    const match = description.match(pattern);
    if (match) {
      // For structural materials, typically the second dimension is the width
      return parseInt(match[2]);
    }
  }
  
  // Look for explicit width mentions
  const widthPatterns = [
    /larghezza[:\s]*(\d+)/i,
    /width[:\s]*(\d+)/i,
    /(\d+)\s*mm\s*larghezza/i,
    /(\d+)\s*mm\s*width/i,
  ];
  
  for (const pattern of widthPatterns) {
    const match = description.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
};

const CertificationCalculatedFieldsCard = ({ layers }: CertificationCalculatedFieldsCardProps) => {
  // Calculate total thickness from layers, excluding guides
  const totalThickness = calculateTotalThicknessExcludingGuides(layers);
  
  // Calculate structure width - try multiple properties to find the width
  const structureWidth = React.useMemo(() => {
    console.log('Calculating structure width from layers:', layers);
    
    const structureLayers = layers.filter(layer => layer.category === 'structure_frame');
    console.log('Structure frame layers:', structureLayers);
    
    let maxWidth = 0;
    
    structureLayers.forEach(layer => {
      console.log('Layer material:', layer.material);
      if (layer.material) {
        // Try different possible property names for width
        let width = layer.material.width || 
                   layer.material.larghezza || 
                   layer.material.dimension || 
                   layer.material.size;
        
        // If no direct width property, try to extract from description
        if (!width && layer.material.description) {
          width = extractWidthFromDescription(layer.material.description);
        }
        
        console.log('Found width:', width);
        if (width && width > maxWidth) {
          maxWidth = width;
        }
      }
    });
    
    console.log('Final structure width:', maxWidth);
    return maxWidth;
  }, [layers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Campi Calcolati Automaticamente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calculated-thickness">Spessore Parete (mm)</Label>
            <Input
              id="calculated-thickness"
              value={totalThickness > 0 ? totalThickness.toString() : ''}
              readOnly
              className="bg-gray-50"
              placeholder="Calcolato dalla composizione"
            />
            <p className="text-xs text-muted-foreground">
              Calcolato automaticamente dalla somma degli spessori dei layer (escluse le guide)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calculated-structure-width">Larghezza Struttura (mm)</Label>
            <Input
              id="calculated-structure-width"
              value={structureWidth > 0 ? structureWidth.toString() : ''}
              readOnly
              className="bg-gray-50"
              placeholder="Dedotto dalla stratigrafia"
            />
            <p className="text-xs text-muted-foreground">
              Dedotto dalla larghezza delle strutture metalliche selezionate
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationCalculatedFieldsCard;
