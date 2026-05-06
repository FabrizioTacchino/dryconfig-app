
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface CertificationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  fireResistance: string;
  onFireResistanceChange: (value: string) => void;
  acousticReduction: string;
  onAcousticReductionChange: (value: string) => void;
  wallType: string;
  onWallTypeChange: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const CertificationFilters = ({
  searchTerm,
  onSearchChange,
  fireResistance,
  onFireResistanceChange,
  acousticReduction,
  onAcousticReductionChange,
  wallType,
  onWallTypeChange,
  onApplyFilters,
  onClearFilters,
  isLoading = false,
}: CertificationFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Ricerca</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nome, codice, soluzione..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fire-resistance">Resistenza al Fuoco</Label>
          <Select value={fireResistance} onValueChange={onFireResistanceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona..." />
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

        <div className="space-y-2">
          <Label htmlFor="acoustic">Abbattimento Acustico (dB)</Label>
          <Select value={acousticReduction} onValueChange={onAcousticReductionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona..." />
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

        <div className="space-y-2">
          <Label htmlFor="wall-type">Tipologia</Label>
          <Select value={wallType} onValueChange={onWallTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="Parete Singola">Parete Singola</SelectItem>
              <SelectItem value="Parete Doppia">Parete Doppia</SelectItem>
              <SelectItem value="Controparete">Controparete</SelectItem>
              <SelectItem value="Rivestimento">Rivestimento</SelectItem>
              <SelectItem value="Soffitto">Soffitto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onApplyFilters} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Cerca
        </Button>
        <Button variant="outline" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-2" />
          Pulisci Filtri
        </Button>
      </div>
    </div>
  );
};

export default CertificationFilters;
