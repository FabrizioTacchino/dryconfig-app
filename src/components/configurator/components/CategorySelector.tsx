
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaterialCategory } from '@/types';

interface CategorySelectorProps {
  selectedCategory: MaterialCategory;
  onCategoryChange: (category: MaterialCategory) => void;
}

const CategorySelector = ({ selectedCategory, onCategoryChange }: CategorySelectorProps) => {
  const categories = [
    { value: 'board', label: 'Lastra', emoji: '🏠' },
    { value: 'structure_frame', label: 'Montanti', emoji: '🏗️' },
    { value: 'structure_guide', label: 'Guide', emoji: '📏' },
    { value: 'insulation', label: 'Isolante', emoji: '🧊' },
    { value: 'accessory', label: 'Accessorio', emoji: '🔧' },
    { value: 'screw', label: 'Viti', emoji: '🔩' },
    { value: 'other', label: 'Altro', emoji: '📦' }
  ];

  return (
    <Select value={selectedCategory} onValueChange={onCategoryChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Seleziona categoria" />
      </SelectTrigger>
      <SelectContent>
        {categories.map(category => (
          <SelectItem key={category.value} value={category.value}>
            <span className="flex items-center gap-2">
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
