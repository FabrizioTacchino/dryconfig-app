
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Volume2, Ruler, User, Building2, Weight } from 'lucide-react';
import StratigraphyActionsMenu from './StratigraphyActionsMenu';
import StratigraphyGraphicalPreview from './StratigraphyGraphicalPreview';
import { UnifiedStratigraphy } from '@/hooks/useUnifiedStratigraphies';

interface EnhancedStratigraphyCardProps {
  stratigraphy: UnifiedStratigraphy;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showActions?: boolean;
}

const EnhancedStratigraphyCard = ({ 
  stratigraphy, 
  isSelected, 
  onSelect,
  showActions = true 
}: EnhancedStratigraphyCardProps) => {
  const handleCardClick = () => {
    onSelect(stratigraphy.id);
  };

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1" onClick={handleCardClick}>
            <RadioGroupItem value={stratigraphy.id} id={stratigraphy.id} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor={stratigraphy.id} className="text-base font-medium cursor-pointer">
                  {stratigraphy.name}
                </Label>
                {stratigraphy.is_certified && (
                  <Badge variant="secondary" className="text-xs">
                    Certificata
                  </Badge>
                )}
              </div>
              {stratigraphy.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stratigraphy.description}
                </p>
              )}
            </div>
          </div>
          {showActions && (
            <div className="ml-2">
              <StratigraphyActionsMenu stratigraphy={stratigraphy} />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Anteprima grafica della stratigrafia */}
        <div className="mb-4">
          <StratigraphyGraphicalPreview 
            stratigraphy={stratigraphy} 
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm" onClick={handleCardClick}>
          {/* Spessore */}
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{stratigraphy.total_thickness} mm</span>
          </div>

          {/* Peso per m² */}
          {stratigraphy.weight_per_sqm && stratigraphy.weight_per_sqm > 0 && (
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{stratigraphy.weight_per_sqm} kg/m²</span>
            </div>
          )}

          {/* Resistenza al fuoco */}
          {stratigraphy.fire_resistance_class && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{stratigraphy.fire_resistance_class}</span>
            </div>
          )}

          {/* Abbattimento acustico */}
          {stratigraphy.acoustic_performance && (
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">{stratigraphy.acoustic_performance} dB</span>
            </div>
          )}

          {/* Nome fornitore */}
          {stratigraphy.supplier_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              <span className="font-medium text-xs">{stratigraphy.supplier_name}</span>
            </div>
          )}

          {/* Costo per m² */}
          {stratigraphy.cost_per_sqm && stratigraphy.cost_per_sqm > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">€{stratigraphy.cost_per_sqm.toFixed(2)}/m²</span>
            </div>
          )}
        </div>

        {/* Informazioni aggiuntive per stratigrafie certificate */}
        {stratigraphy.is_certified && stratigraphy.certification_id && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Certificazione ID: {stratigraphy.certification_id}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedStratigraphyCard;
