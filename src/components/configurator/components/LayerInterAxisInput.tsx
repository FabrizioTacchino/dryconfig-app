
import React from 'react';
import { Input } from '@/components/ui/input';

interface LayerInterAxisInputProps {
  value: number;
  onChange: (value: number) => void;
}

const LayerInterAxisInput = ({ value, onChange }: LayerInterAxisInputProps) => {
  return (
    <div className="w-20">
      <Input
        type="number"
        value={value || 600}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-xs w-full"
        placeholder="600"
        min={1}
      />
    </div>
  );
};

export default LayerInterAxisInput;
