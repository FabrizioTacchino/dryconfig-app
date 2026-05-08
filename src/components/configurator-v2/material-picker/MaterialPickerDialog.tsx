import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { ArrowDownUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMaterials, type DatabaseMaterial, type MaterialCategory } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'thickness_asc' | 'thickness_desc' | 'name';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'relevance',     label: 'Rilevanza (default)' },
  { value: 'price_asc',     label: 'Prezzo crescente' },
  { value: 'price_desc',    label: 'Prezzo decrescente' },
  { value: 'thickness_asc', label: 'Spessore crescente' },
  { value: 'thickness_desc',label: 'Spessore decrescente' },
  { value: 'name',          label: 'Nome A-Z' },
];

/** Sub-filtri per category=board: tipologie tecniche più comuni. */
const BOARD_TYPOLOGY_CHIPS: { key: string; label: string; matches: (m: DatabaseMaterial) => boolean }[] = [
  { key: 'standard',    label: 'Standard',     matches: m => m.board_typology === 'standard' || m.material_type === 'gesso_rivestito' || m.material_type === 'gesso_rivestito_activair' },
  { key: 'idro',        label: 'Idrofuga',     matches: m => /idro|hydro|H1/i.test(`${m.board_typology} ${m.material_type} ${m.en_520_type}`) },
  { key: 'ignifuga',    label: 'Ignifuga',     matches: m => /fire|ignifug|DF/i.test(`${m.board_typology} ${m.material_type} ${m.en_520_type}`) },
  { key: 'alta_dens',   label: 'Alta densità', matches: m => /alta_dens|habito|DFIR|D, I/i.test(`${m.board_typology} ${m.material_type} ${m.en_520_type}`) },
  { key: 'cementizia',  label: 'Cementizia',   matches: m => /cement|aquaroc/i.test(`${m.material_type}`) },
  { key: 'forata',      label: 'Forata acust.',matches: m => /forat|acoust|gyptone|rigitone/i.test(`${m.board_typology} ${m.material_type} ${m.name}`) },
  { key: 'A1',          label: 'A1 incomb.',   matches: m => /A1/i.test(`${m.fire_class} ${m.material_type} ${m.en_520_type}`) },
];

interface MaterialPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: MaterialCategory | 'all';
  onSelect: (material: DatabaseMaterial) => void;
}

const MaterialPickerDialog: React.FC<MaterialPickerDialogProps> = ({
  open,
  onOpenChange,
  initialCategory = 'all',
  onSelect,
}) => {
  const { data: allMaterials = [], isLoading } = useMaterials();

  // Lista fornitori NON di sistema (esclude DryCore set generico)
  const { data: visibleSuppliers = [] } = useQuery({
    queryKey: ['suppliers-visible'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('name, slug, is_system')
        .order('name');
      if (error) throw error;
      return (data ?? []).filter((s: any) => !s.is_system).map((s: any) => s.name as string);
    },
    staleTime: 1000 * 60 * 60,
  });

  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>(initialCategory);
  const [activeSupplier, setActiveSupplier] = useState<string | 'all'>('all');
  const [activeTypology, setActiveTypology] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');

  // Sync iniziale
  React.useEffect(() => {
    if (open) {
      setActiveCategory(initialCategory);
      setActiveTypology('all');
      setSearch('');
      setSortBy('relevance');
    }
  }, [open, initialCategory]);

  // Materiali "visibili" = non di sistema. Per filtrare per supplier_name uso l'array dei fornitori non-system.
  const baseMaterials = useMemo(() => {
    if (visibleSuppliers.length === 0) return allMaterials;
    return allMaterials.filter(m => !m.supplier || visibleSuppliers.includes(m.supplier));
  }, [allMaterials, visibleSuppliers]);

  // Pool per category attivo (per count fornitori dinamico)
  const poolByCategory = useMemo(() => {
    if (activeCategory === 'all') return baseMaterials;
    return baseMaterials.filter(m => m.category === activeCategory);
  }, [baseMaterials, activeCategory]);

  // Pool per supplier attivo (per count categorie dinamico)
  const poolBySupplier = useMemo(() => {
    if (activeSupplier === 'all') return baseMaterials;
    return baseMaterials.filter(m => m.supplier === activeSupplier);
  }, [baseMaterials, activeSupplier]);

  // Filtrati = intersezione categoria + fornitore + tipologia
  const filtered = useMemo(() => {
    let arr = baseMaterials;
    if (activeCategory !== 'all') arr = arr.filter(m => m.category === activeCategory);
    if (activeSupplier !== 'all') arr = arr.filter(m => m.supplier === activeSupplier);
    if (activeCategory === 'board' && activeTypology !== 'all') {
      const chip = BOARD_TYPOLOGY_CHIPS.find(c => c.key === activeTypology);
      if (chip) arr = arr.filter(chip.matches);
    }
    return arr;
  }, [baseMaterials, activeCategory, activeSupplier, activeTypology]);

  // Ordinamento (cmdk applica già rilevanza per fuzzy sopra al sort esplicito)
  const sorted = useMemo(() => {
    if (sortBy === 'relevance') return filtered;
    const arr = [...filtered];
    const priceOf = (m: DatabaseMaterial) => Number(m.net_price ?? m.unit_price ?? 0);
    const thickOf = (m: DatabaseMaterial) => Number(m.thickness ?? 0);
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':      return priceOf(a) - priceOf(b);
        case 'price_desc':     return priceOf(b) - priceOf(a);
        case 'thickness_asc':  return thickOf(a) - thickOf(b);
        case 'thickness_desc': return thickOf(b) - thickOf(a);
        case 'name':           return (a.name ?? '').localeCompare(b.name ?? '');
        default: return 0;
      }
    });
    return arr;
  }, [filtered, sortBy]);

  const handleSelect = (material: DatabaseMaterial) => {
    onSelect(material);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Seleziona materiale</DialogTitle>
          <DialogDescription className="text-xs">
            Cerca per codice, nome o fornitore. Filtra per categoria, fornitore e tipologia.
          </DialogDescription>
        </DialogHeader>

        {/* Tab categoria con count dinamici sul pool del supplier attivo */}
        <div className="flex flex-wrap gap-1 px-4 py-2 border-b">
          {CATEGORY_TABS.map(tab => {
            const count = tab.value === 'all'
              ? poolBySupplier.length
              : poolBySupplier.filter(m => m.category === tab.value).length;
            return (
              <Button
                key={tab.value}
                size="sm"
                variant={activeCategory === tab.value ? 'default' : 'outline'}
                onClick={() => { setActiveCategory(tab.value); setActiveTypology('all'); }}
                className="h-7 text-xs"
                disabled={count === 0 && tab.value !== 'all'}
              >
                {tab.label}
                <span className="ml-1 opacity-70">{count}</span>
              </Button>
            );
          })}
        </div>

        {/* Sub-chip tipologia (solo per category=board) */}
        {activeCategory === 'board' && (
          <div className="flex flex-wrap gap-1 px-4 py-2 border-b bg-muted/30">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide self-center mr-2">
              Tipologia:
            </span>
            <Button
              size="sm"
              variant={activeTypology === 'all' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTypology('all')}
              className="h-6 text-[11px] px-2"
            >
              Tutte
            </Button>
            {BOARD_TYPOLOGY_CHIPS.map(chip => {
              const count = poolBySupplier.filter(m => m.category === 'board' && chip.matches(m)).length;
              if (count === 0) return null;
              return (
                <Button
                  key={chip.key}
                  size="sm"
                  variant={activeTypology === chip.key ? 'secondary' : 'ghost'}
                  onClick={() => setActiveTypology(chip.key)}
                  className="h-6 text-[11px] px-2"
                >
                  {chip.label} <span className="ml-1 opacity-70">{count}</span>
                </Button>
              );
            })}
          </div>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Filtri laterali fornitore con count dinamici sul pool della categoria attiva */}
          <div className="w-52 border-r p-3 hidden md:block overflow-auto">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Fornitore</div>
            <div className="space-y-1">
              <button
                className={`w-full text-left text-xs px-2 py-1 rounded ${activeSupplier === 'all' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                onClick={() => setActiveSupplier('all')}
              >
                Tutti <span className="opacity-70">({poolByCategory.length})</span>
              </button>
              {visibleSuppliers.map(s => {
                const count = poolByCategory.filter(m => m.supplier === s).length;
                if (count === 0) return null; // nasconde se 0 nella categoria attiva
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

          {/* Search + lista + sort */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Command shouldFilter={true} className="flex-1 flex flex-col">
              <div className="flex items-center border-b">
                <CommandInput
                  placeholder="🔍 Cerca per codice, nome, fornitore…"
                  value={search}
                  onValueChange={setSearch}
                  className="h-10 flex-1 border-0"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 mx-2 gap-1.5 text-xs">
                      <ArrowDownUp className="h-3.5 w-3.5" />
                      {SORT_OPTIONS.find(s => s.value === sortBy)?.label.split(' ')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {SORT_OPTIONS.map(opt => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={sortBy === opt.value ? 'bg-primary/10' : ''}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CommandList className="flex-1 overflow-auto">
                {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Caricamento…</div>}
                <CommandEmpty>Nessun materiale trovato.</CommandEmpty>
                <CommandGroup>
                  {sorted.map(m => {
                    const netPrice = m.net_price ?? m.unit_price ?? 0;
                    const listPrice = m.list_price ?? netPrice;
                    const isDiscounted = listPrice > netPrice + 0.001;
                    const searchValue = `${m.code} ${m.name} ${m.supplier} ${m.material_type ?? ''} ${m.family_code ?? ''}`;
                    return (
                      <CommandItem
                        key={m.id}
                        value={searchValue}
                        onSelect={() => handleSelect(m)}
                        className="flex items-start gap-3 cursor-pointer py-2"
                      >
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
