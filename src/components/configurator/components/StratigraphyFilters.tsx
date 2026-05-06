
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { WallType } from '@/types';

interface StratigraphyFiltersProps {
  wallType: WallType | 'all';
  onWallTypeChange: (type: WallType | 'all') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  materialSearchTerm?: string;
  onMaterialSearchChange?: (term: string) => void;
  showCertifiedOnly: boolean;
  onCertifiedFilterChange: (certified: boolean) => void;
  showCustomOnly: boolean;
  onCustomFilterChange: (custom: boolean) => void;
  totalCount: number;
  certifiedCount: number;
  customCount: number;
  disabled?: boolean;
  // Certification-specific filters
  fireResistance?: string;
  onFireResistanceChange?: (value: string) => void;
  acousticReduction?: string;
  onAcousticReductionChange?: (value: string) => void;
  supplierName?: string;
  onSupplierNameChange?: (value: string) => void;
  thicknessRange?: string;
  onThicknessRangeChange?: (value: string) => void;
}

const StratigraphyFilters = ({
  wallType,
  onWallTypeChange,
  searchTerm,
  onSearchChange,
  materialSearchTerm,
  onMaterialSearchChange,
  showCertifiedOnly,
  onCertifiedFilterChange,
  showCustomOnly,
  onCustomFilterChange,
  totalCount,
  certifiedCount,
  customCount,
  disabled = false,
  fireResistance,
  onFireResistanceChange,
  acousticReduction,
  onAcousticReductionChange,
  supplierName,
  onSupplierNameChange,
  thicknessRange,
  onThicknessRangeChange
}: StratigraphyFiltersProps) => {
  // Define labels for all supported wall types, including the legacy ones
  const wallTypeLabels: Record<WallType | 'all', string> = {
    all: 'Tutte',
    plating: 'Placcatura',
    counterwall: 'Controparete', 
    single: 'Parete singola',
    double: 'Parete doppia',
    ceiling: 'Controsoffitto',
    internal: 'Parete interna',
    external: 'Parete esterna',
    roof: 'Copertura',
    foundation: 'Fondazione'
  };

  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="space-y-2">
          {/* Prima riga: Tipologia parete, Cerca per nome e Cerca per materiale */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-xs font-medium mb-0.5 block">Tipologia parete</Label>
              <Select 
                value={wallType} 
                onValueChange={onWallTypeChange} 
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Seleziona tipologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="plating">Placcatura</SelectItem>
                  <SelectItem value="counterwall">Controparete</SelectItem>
                  <SelectItem value="single">Parete singola</SelectItem>
                  <SelectItem value="double">Parete doppia</SelectItem>
                  <SelectItem value="ceiling">Controsoffitto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-0.5 block">Cerca per nome</Label>
              <Input
                placeholder="Cerca stratigrafie..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={disabled}
                className="h-7 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-0.5 block">Cerca per materiale</Label>
              <Input
                placeholder="Cerca per materiale..."
                value={materialSearchTerm || ''}
                onChange={(e) => onMaterialSearchChange?.(e.target.value)}
                disabled={disabled}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Seconda riga: Resistenza al fuoco, Abbattimento acustico, Spessore parete, Fornitore */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs font-medium mb-0.5 block">Resistenza al Fuoco</Label>
              <Select 
                value={fireResistance || 'all'} 
                onValueChange={onFireResistanceChange} 
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="EI 30">EI 30</SelectItem>
                  <SelectItem value="EI 60">EI 60</SelectItem>
                  <SelectItem value="EI 90">EI 90</SelectItem>
                  <SelectItem value="EI 120">EI 120</SelectItem>
                  <SelectItem value="EI 180">EI 180</SelectItem>
                  <SelectItem value="EI 240">EI 240</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-0.5 block">Abbattimento Acustico (dB)</Label>
              <Select 
                value={acousticReduction || 'all'} 
                onValueChange={onAcousticReductionChange} 
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="30">≥ 30 dB</SelectItem>
                  <SelectItem value="40">≥ 40 dB</SelectItem>
                  <SelectItem value="50">≥ 50 dB</SelectItem>
                  <SelectItem value="60">≥ 60 dB</SelectItem>
                  <SelectItem value="70">≥ 70 dB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-0.5 block">Spessore Parete (mm)</Label>
              <Select 
                value={thicknessRange || 'all'} 
                onValueChange={onThicknessRangeChange} 
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="0-50">0-50 mm</SelectItem>
                  <SelectItem value="51-100">51-100 mm</SelectItem>
                  <SelectItem value="101-150">101-150 mm</SelectItem>
                  <SelectItem value="151-200">151-200 mm</SelectItem>
                  <SelectItem value="200+">200+ mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-0.5 block">Fornitore</Label>
              <Input
                placeholder="Nome fornitore..."
                value={supplierName || ''}
                onChange={(e) => onSupplierNameChange?.(e.target.value)}
                disabled={disabled}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Terza riga: Badge filtri compatti */}
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={!showCertifiedOnly && !showCustomOnly ? "default" : "outline"}
              className={`cursor-pointer text-xs px-2 py-0.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onCertifiedFilterChange(false);
                  onCustomFilterChange(false);
                }
              }}
            >
              Tutte ({totalCount})
            </Badge>
            <Badge
              variant={showCertifiedOnly ? "default" : "outline"}
              className={`cursor-pointer text-xs px-2 py-0.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onCertifiedFilterChange(!showCertifiedOnly);
                  onCustomFilterChange(false);
                }
              }}
            >
              Certificate ({certifiedCount})
            </Badge>
            <Badge
              variant={showCustomOnly ? "default" : "outline"}
              className={`cursor-pointer text-xs px-2 py-0.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onCustomFilterChange(!showCustomOnly);
                  onCertifiedFilterChange(false);
                }
              }}
            >
              Personalizzate ({customCount})
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StratigraphyFilters;
