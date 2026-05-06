
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SummaryFormProps {
  wallName: string;
  setWallName: (value: string) => void;
  wallArea: number;
  setWallArea: (value: number) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  isWallNameValid: boolean;
  isWallAreaValid: boolean;
  isQuantityValid: boolean;
}

const SummaryForm = ({
  wallName,
  setWallName,
  wallArea,
  setWallArea,
  quantity,
  setQuantity,
  isWallNameValid,
  isWallAreaValid,
  isQuantityValid,
}: SummaryFormProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="wall-name">
          Nome parete *
          {isWallNameValid ? (
            <CheckCircle className="inline h-4 w-4 ml-1 text-green-500" />
          ) : (
            <AlertCircle className="inline h-4 w-4 ml-1 text-red-500" />
          )}
        </Label>
        <Input 
          id="wall-name" 
          placeholder="Inserisci nome parete" 
          value={wallName}
          onChange={(e) => setWallName(e.target.value)}
          className={!isWallNameValid && wallName ? 'border-red-300' : ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wall-area">
          Superficie (mq) *
          {isWallAreaValid ? (
            <CheckCircle className="inline h-4 w-4 ml-1 text-green-500" />
          ) : (
            <AlertCircle className="inline h-4 w-4 ml-1 text-red-500" />
          )}
        </Label>
        <Input 
          id="wall-area" 
          type="number" 
          placeholder="0.00" 
          min="0" 
          step="0.01"
          value={wallArea || ''}
          onChange={(e) => setWallArea(Number(e.target.value))}
          className={!isWallAreaValid && wallArea !== 0 ? 'border-red-300' : ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">
          Quantità *
          {isQuantityValid ? (
            <CheckCircle className="inline h-4 w-4 ml-1 text-green-500" />
          ) : (
            <AlertCircle className="inline h-4 w-4 ml-1 text-red-500" />
          )}
        </Label>
        <Input 
          id="quantity" 
          type="number" 
          placeholder="1" 
          min="1" 
          step="1"
          value={quantity || ''}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className={!isQuantityValid && quantity !== 0 ? 'border-red-300' : ''}
        />
      </div>
    </div>
  );
};

export default SummaryForm;
