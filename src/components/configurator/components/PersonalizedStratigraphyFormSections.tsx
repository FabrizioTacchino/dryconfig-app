
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { WallType } from '@/types';
import { getWallTypeDescription } from '../utils/wallTypeDetection';
import SupplierFilter from './SupplierFilter';

interface PersonalizedStratigraphyFormData {
  name: string;
  description: string;
  type: WallType;
  finishLevel?: string;
  selectedSupplier?: string;
}

interface PersonalizedStratigraphyFormSectionsProps {
  formData: PersonalizedStratigraphyFormData;
  onFormChange: (field: keyof PersonalizedStratigraphyFormData, value: any) => void;
  isNameValid?: boolean;
  finishLevels?: { finish_level: string }[];
  availableMaterials?: any[];
}

const PersonalizedStratigraphyFormSections = ({
  formData,
  onFormChange,
  isNameValid = true,
  finishLevels = [],
  availableMaterials = [],
}: PersonalizedStratigraphyFormSectionsProps) => {
  const wallTypeDescription = getWallTypeDescription(formData.type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuratore Stratigrafia Personalizzata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stratigraphy-name">
                Nome Stratigrafia *
                {isNameValid ? (
                  <CheckCircle className="inline h-4 w-4 ml-1 text-green-500" />
                ) : (
                  <AlertCircle className="inline h-4 w-4 ml-1 text-red-500" />
                )}
              </Label>
              <Input
                id="stratigraphy-name"
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Es: Parete divisoria standard"
                className={!isNameValid && formData.name ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipologia (Determinata Automaticamente)</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {wallTypeDescription}
                </span>
              </div>
            </div>
          </div>


          <div className="space-y-2">
            <Label htmlFor="stratigraphy-description">Descrizione</Label>
            <Textarea
              id="stratigraphy-description"
              value={formData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder="Descrizione tecnica della stratigrafia..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtro Fornitore */}
      {availableMaterials && availableMaterials.length > 0 && (
        <SupplierFilter
          materials={availableMaterials}
          selectedSupplier={formData.selectedSupplier || 'all'}
          onSupplierChange={(supplier) => onFormChange('selectedSupplier', supplier)}
        />
      )}
    </div>
  );
};

export default PersonalizedStratigraphyFormSections;
