import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, MoreHorizontal } from 'lucide-react';
import BackButton from '@/components/layout/BackButton';

interface ConfiguratorHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  systemCode?: string | null;
  typology?: string | null;
  supplierFilterLabel?: string | null;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  canSave: boolean;
}

/**
 * Header del configuratore V2: BackButton, nome editabile inline, codice sistema,
 * tipologia auto, filtro fornitore, pulsante Salva, menu kebab.
 *
 * Vedi `docs/mockupui.md` §6.
 */
const ConfiguratorHeader: React.FC<ConfiguratorHeaderProps> = ({
  name,
  onNameChange,
  systemCode,
  typology,
  supplierFilterLabel,
  isDirty,
  isSaving,
  onSave,
  canSave,
}) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <BackButton label="Indietro" />

      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nome stratigrafia (es. Parete divisoria 75)"
          className="w-full text-2xl font-bold tracking-tight bg-transparent border-0 outline-none placeholder:text-muted-foreground/50 focus:ring-0"
          aria-label="Nome stratigrafia"
        />
        <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
          {systemCode && (
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wide">
              {systemCode}
            </Badge>
          )}
          {typology && (
            <span className="text-xs">· {typology}</span>
          )}
          {supplierFilterLabel && (
            <Badge variant="secondary" className="text-[10px]">
              {supplierFilterLabel}
            </Badge>
          )}
        </div>
      </div>

      <Button
        size="sm"
        onClick={onSave}
        disabled={!canSave || isSaving}
        className="gap-1.5"
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Salvataggio…' : isDirty ? 'Salva •' : 'Salva'}
      </Button>

      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Altre azioni">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ConfiguratorHeader;
