
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { WallType } from '@/types';
import { getWallTypeDescription } from '../utils/wallTypeDetection';

interface StratigraphyFormProps {
  stratigraphyName: string;
  onNameChange: (name: string) => void;
  stratigraphyDescription: string;
  onDescriptionChange: (description: string) => void;
  wallType: WallType;
  isNameValid: boolean;
}

const StratigraphyForm = ({
  stratigraphyName,
  onNameChange,
  stratigraphyDescription,
  onDescriptionChange,
  wallType,
  isNameValid,
}: StratigraphyFormProps) => {
  const wallTypeDescription = getWallTypeDescription(wallType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuratore Stratigrafia</CardTitle>
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
              value={stratigraphyName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Es: Parete divisoria standard"
              className={!isNameValid && stratigraphyName ? 'border-red-300' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tipologia (Determinata Automaticamente)</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {wallType.charAt(0).toUpperCase() + wallType.slice(1)}
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
            value={stratigraphyDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Descrizione tecnica della stratigrafia..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StratigraphyForm;
