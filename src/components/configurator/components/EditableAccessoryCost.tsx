
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';

interface EditableAccessoryCostProps {
  label: string;
  emoji: string;
  defaultValue: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const EditableAccessoryCost = ({
  label,
  emoji,
  defaultValue,
  value,
  onChange,
  className = ''
}: EditableAccessoryCostProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <div className="flex items-center gap-2">
        <span>{emoji}</span>
        <span className="text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-20 h-7 text-xs"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-7 w-7 p-0"
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-medium text-gray-700">
              €{value.toFixed(2)}/m²
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
            >
              <Edit2 className="h-3 w-3 text-gray-400" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default EditableAccessoryCost;
