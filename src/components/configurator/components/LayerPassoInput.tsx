
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';

interface LayerPassoInputProps {
  value: number;
  onChange: (passo: number) => void;
  incidenceBase?: number;
}

const LayerPassoInput = ({ value, onChange, incidenceBase }: LayerPassoInputProps) => {
  const calculateIncidence = (passo: number) => {
    if (!incidenceBase || !passo) return 0;
    return (incidenceBase * (600 / passo)).toFixed(3);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-1">
        <Calculator className="h-3 w-3" />
        Passo (mm)
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="600"
        className="text-sm"
        min="100"
        max="1000"
        step="50"
      />
      {incidenceBase && value && (
        <div className="text-xs text-muted-foreground">
          Incidenza calcolata: {calculateIncidence(value)}/m²
        </div>
      )}
    </div>
  );
};

export default LayerPassoInput;
