import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMaterials, type DatabaseMaterial, type MaterialCategory } from '@/hooks/useMaterials';

const CATEGORY_TABS: { value: MaterialCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'board', label: 'Lastre' },
  { value: 'insulation', label: 'Isolanti' },
  { value: 'structure_frame', label: 'Montanti' },
  { value: 'structure_guide', label: 'Guide' },
  { value: 'screw', label: 'Viti' },
  { value: 'accessory', label: 'Accessori' },
  { value: 'finish', label: 'Finiture' },
  { value: 'ceiling_tile', label: 'Pannelli soff.' },
];

interface MaterialPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Categoria suggerita per il primo filtro (es. 'board' se sto aggiungendo una lastra). */
  initialCategory?: MaterialCategory | 'all';
  /** Lista fornitori da mostrare nei filtri. Se omessa, calcolata dai materiali. */
  onSelect: (material: DatabaseMaterial) => void;
}

/**
 * Modal di selezione materiali con cmdk (fuzzy search) e filtri faceted.
 *
 * V2.0-S5: filtri base (categoria, fornitore). Filtri avanzati (spessore range,
 * tipologia, EN 520) arriveranno in V2.2.
 *
 * Vedi `docs/mockupui.md` §8.
 */
const MaterialPickerDialog: React.FC<MaterialPickerDialogProps> = ({
  open,
  onOpenChange,
  initialCategory = 'all',
  onSelect,
}) => {
  const { data: materials = [], isLoading } = useMaterials();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>(initialCategory);
  const [activeSupplier, setActiveSupplier] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');

  // Quando si apre o cambia categoria iniziale, sincronizza
  React.useEffect(() => {
    if (open) setActiveCategory(initialCategory);
  }, [open, initialCategory]);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    materials.forEach(m => m.supplier && set.add(m.supplier));
    return Array.from(set).sort();
  }, [materials]);

  const filtered = useMemo(() => {
    return materials.filter(m => {
      if (activeCategory !== 'all' && m.category !== activeCategory) return false;
      if (activeSupplier !== 'all' && m.supplier !== activeSupplier) return false;
      return true;
    });
  }, [materials, activeCategory, activeSupplier]);

  // cmdk fa fuzzy search nativo via valore di CommandItem.
  const handleSelect = (material: DatabaseMaterial) => {
    onSelect(material);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Seleziona materiale</DialogTitle>
          <DialogDescription className="text-xs">
            Cerca per codice, nome o fornitore. Filtra per categoria e fornitore.
          </DialogDescription>
        </DialogHeader>

        {/* Tab categoria */}
        <div className="flex flex-wrap gap-1 px-4 py-2 border-b">
          {CATEGORY_TABS.map(tab => {
            const count = tab.value === 'all'
              ? materials.length
              : materials.filter(m => m.category === tab.value).length;
            return (
              <Button
                key={tab.value}
                size="sm"
                variant={activeCategory === tab.value ? 'default' : 'outline'}
                onClick={() => setActiveCategory(tab.value)}
                className="h-7 text-xs"
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 opacity-70">{count}</span>
                )}
              </Button>
            );
          })}
        </div>

        <div className="flex max-h-[60vh]">
          {/* Filtri laterali */}
          <div className="w-48 border-r p-3 space-y-3 hidden md:block">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Fornitore</div>
              <div className="space-y-1">
                <button
                  className={`w-full text-left text-xs px-2 py-1 rounded ${activeSupplier === 'all' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                  onClick={() => setActiveSupplier('all')}
                >
                  Tutti ({materials.length})
                </button>
                {suppliers.map(s => {
                  const count = materials.filter(m => m.supplier === s).length;
                  return (
                    <button
                      key={s}
                      className={`w-full text-left text-xs px-2 py-1 rounded ${activeSupplier === s ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                      onClick={() => setActiveSupplier(s)}
                    >
                      {s} <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search + lista */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Command shouldFilter={true}>
              <CommandInput
                placeholder="🔍 Cerca per codice, nome, fornitore…"
                value={search}
                onValueChange={setSearch}
                className="h-10"
              />
              <CommandList className="max-h-[50vh] overflow-auto">
                {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Caricamento…</div>}
                <CommandEmpty>Nessun materiale trovato.</CommandEmpty>
                <CommandGroup>
                  {filtered.map(m => {
                    const netPrice = m.net_price ?? m.unit_price ?? 0;
                    const listPrice = m.list_price ?? netPrice;
                    const isDiscounted = listPrice > netPrice + 0.001;
                    // value = stringa concatenata che cmdk usa per il fuzzy search
                    const searchValue = `${m.code} ${m.name} ${m.supplier} ${m.material_type ?? ''} ${m.family_code ?? ''}`;
                    return (
                      <CommandItem
                        key={m.id}
                        value={searchValue}
                        onSelect={() => handleSelect(m)}
                        className="flex items-start gap-3 cursor-pointer py-2"
                      >
                        {/* Mini swatch colore */}
                        <div
                          className="w-10 h-10 rounded border border-zinc-200 shrink-0"
                          style={{ backgroundColor: swatchColor(m) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{m.supplier}</span>
                            {m.material_type && <span>· {m.material_type}</span>}
                            {m.thickness != null && <span>· {m.thickness} mm</span>}
                            {m.width != null && (m.category === 'structure_frame' || m.category === 'structure_guide') && (
                              <span>· sez. {m.width} mm</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-medium text-sm text-green-700">
                            €{netPrice.toFixed(2)}/{m.unit}
                          </div>
                          {isDiscounted && (
                            <div className="text-[10px] text-muted-foreground line-through">
                              €{listPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/** Colore "swatch" per la riga del materiale, coerente con la palette imitativa. */
function swatchColor(m: DatabaseMaterial): string {
  const mt = (m.material_type ?? '').toLowerCase();
  const cat = m.category;
  if (cat === 'screw') return '#1F2937';
  if (cat === 'structure_frame' || cat === 'structure_guide') return '#9CA3AF';
  if (cat === 'finish') return '#E5E7EB';
  if (mt.includes('idro') || mt.includes('hydro')) return '#CEE3F0';
  if (mt.includes('ignifug') || mt.includes('fire')) return '#F4D3CF';
  if (mt.includes('cemento') || mt.includes('aquaroc')) return '#C9C2B6';
  if (mt.includes('glasroc')) return '#D8E8DA';
  if (mt.includes('lana_roccia')) return '#FFE08A';
  if (mt.includes('lana_vetro')) return '#FFF3B8';
  if (mt.includes('eps') || mt.includes('xps')) return '#F0F0F0';
  if (mt.includes('pir')) return '#FFD6A5';
  if (cat === 'board' || cat === 'ceiling_tile') return '#F5F1E8';
  return '#FFFFFF';
}

export default MaterialPickerDialog;
