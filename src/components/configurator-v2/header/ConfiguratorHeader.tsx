import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Save, MoreHorizontal, ShieldCheck, User, FilePlus2, Trash2 } from 'lucide-react';
import BackButton from '@/components/layout/BackButton';

interface ConfiguratorHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  systemCode?: string | null;
  typology?: string | null;
  supplierFilterLabel?: string | null;
  isCertified?: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  canSave: boolean;
  /** Quando true mostra anche il pulsante "Aggiungi a preventivo". */
  canAddToEstimate?: boolean;
  onAddToEstimate?: () => void;
  /** Se la stratigrafia è già stata salvata (= ha id), abilita il tasto Elimina nel kebab. */
  canDelete?: boolean;
  onDelete?: () => void;
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
  isCertified = false,
  isDirty,
  isSaving,
  onSave,
  canSave,
  canAddToEstimate = false,
  onAddToEstimate,
  canDelete = false,
  onDelete,
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
          <Badge
            variant="outline"
            className={
              isCertified
                ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200 text-[10px]'
            }
            title={isCertified
              ? 'Stratigrafia certificata: i parametri normativi sono inseriti nel pannello Certificazione (sotto la composizione layer)'
              : 'Stratigrafia personalizzata. Per certificarla attiva il toggle nel pannello Certificazione (sotto la composizione layer)'}
          >
            {isCertified ? (
              <><ShieldCheck className="h-3 w-3 mr-1" /> Certificata</>
            ) : (
              <><User className="h-3 w-3 mr-1" /> Personalizzata</>
            )}
          </Badge>
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

      {/* Due bottoni espliciti: "Salva" (secondario, per stratigrafie certificate del catalogo)
          e "Salva e aggiungi a preventivo" (primario, flusso cantiere ~99% dei casi).
          Il kebab tiene Elimina. */}
      <Button
        size="sm"
        variant="outline"
        onClick={onSave}
        disabled={!canSave || isSaving}
        className="gap-1.5"
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Salvataggio…' : isDirty ? 'Salva •' : 'Salva'}
      </Button>
      {canAddToEstimate && onAddToEstimate && (
        <Button
          size="sm"
          onClick={onAddToEstimate}
          disabled={isSaving}
          className="gap-1.5"
        >
          <FilePlus2 className="h-4 w-4" />
          Salva e aggiungi a preventivo
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSaving}
            className="px-2"
            aria-label="Altre azioni"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => onDelete?.()}
            disabled={!canDelete}
            className={canDelete ? 'text-destructive focus:text-destructive' : ''}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Elimina stratigrafia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ConfiguratorHeader;
