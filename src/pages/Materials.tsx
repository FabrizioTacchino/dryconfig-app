import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search 
} from 'lucide-react';
import { useMaterials, DatabaseMaterial, MaterialCategory } from '@/hooks/useMaterials';
import MaterialsTable from '@/components/materials/MaterialsTable';
import CreateMaterialDialog from '@/components/materials/CreateMaterialDialog';
import EditMaterialDialog from '@/components/materials/EditMaterialDialog';
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { exportMaterialsToExcel } from '@/utils/export/exportMaterialsExcel';
import { parseMaterialsExcel, ParsedMaterialInput } from '@/utils/import/importMaterialsExcel';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useMaterialsSorting } from '@/hooks/useMaterialsSorting';

// Separare la lista delle categorie in un modulo helper
const materialCategoryOptions: { value: MaterialCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutte le categorie' },
  { value: 'board', label: 'Lastre' },
  { value: 'ceiling_tile', label: 'Pannelli controsoffitto' },
  { value: 'structure_frame', label: 'Struttura - Montanti' },
  { value: 'structure_guide', label: 'Struttura - Guide' },
  { value: 'insulation', label: 'Isolanti' },
  { value: 'accessory', label: 'Accessori' },
  { value: 'screw', label: 'Viti' },
  { value: 'finish', label: 'Finiture (intonaci/rasanti)' },
  { value: 'other', label: 'Altro' }
];

// allowed categories for import:
const allowedCategories = [
  'board', 'ceiling_tile', 'structure_frame', 'structure_guide',
  'insulation', 'accessory', 'screw', 'finish', 'other'
] as const;

// helper filtraggio materiali (estraibile volendo)
const filterMaterials = (
  materials: DatabaseMaterial[],
  searchTerm: string,
  selectedCategory: MaterialCategory | 'all'
): DatabaseMaterial[] => {
  return materials.filter((material: DatabaseMaterial) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
};

const Stat: React.FC<{ label: string; value: React.ReactNode; accent?: string }> = ({ label, value, accent = '' }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-xl font-bold ${accent}`}>{value}</div>
  </div>
);

const Materials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  // Attenzione: usiamo 'all' come valore extra, quindi lasciamo il tipo come MaterialCategory | 'all'
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedMaterialInput[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const { data: materials = [], isLoading, refetch } = useMaterials();

  // Includiamo anche 'other' tra le categorie ammesse all'import
  const filteredMaterials = filterMaterials(materials, searchTerm, selectedCategory);

  // ---- ORDINAMENTO ----
  const {
    sortField,
    sortDirection,
    setSort,
    getSortedMaterials,
  } = useMaterialsSorting('name', 'asc');
  const sortedMaterials = getSortedMaterials(filteredMaterials);

  const handleMaterialCreated = () => {
    refetch();
  };

  const handleMaterialUpdated = () => {
    refetch();
  };

  const handleExportMaterials = () => {
    exportMaterialsToExcel(filteredMaterials);
    toast.success("File esportato correttamente.");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { materials, errors } = await parseMaterialsExcel(file);
    // Filtra solo materiali con categoria valida, ora incluye anche 'other'
    const validMaterials = materials.filter(m =>
      allowedCategories.includes(m.category as MaterialCategory)
    ).map(m => ({
      ...m,
      category: m.category as MaterialCategory
    }));
    const invalidRows = materials
      .filter(m => !allowedCategories.includes(m.category as MaterialCategory))
      .map(m => `Codice ${m.code}: categoria non valida "${m.category}"`);
    setImportPreview(validMaterials);
    setImportErrors([...errors, ...invalidRows]);
  };

  const handleSaveImport = async () => {
    setImporting(true);
    let ok = 0, fail = 0;
    // allowed categories strictly type-safe (inclusa 'other', 'screw')
    for (const m of importPreview) {
      if (!allowedCategories.includes(m.category as MaterialCategory)) {
        fail++;
        continue;
      }
      const inputMaterial = {
        code: m.code,
        name: m.name,
        category: m.category as MaterialCategory,
        supplier: m.supplier,
        thickness: m.thickness ?? null,
        width: m.width ?? null,
        length: m.length ?? null,
        unit_price: m.unit_price,
        unit: m.unit,
        incidence_per_sqm: m.incidence_per_sqm ?? null,
        description: m.description ?? null,
        material_type: m.material_type ?? null,
      };

      // Match per codice: aggiorna oppure inserisce nuovo
      const { data } = await supabase
        .from('materials')
        .select('id')
        .eq('code', m.code)
        .maybeSingle();
      if (data) {
        // update
        const { error } = await supabase
          .from('materials')
          .update(inputMaterial as any) // <-- Fix: cast to any for supabase
          .eq('id', data.id);
        error ? fail++ : ok++;
      } else {
        // insert
        const { error } = await supabase
          .from('materials')
          .insert([inputMaterial as any]); // <-- Fix: cast to any for supabase
        error ? fail++ : ok++;
      }
    }
    setImporting(false);
    setImportDialogOpen(false);
    setImportPreview([]);
    setImportErrors([]);
    if (ok > 0) {
      toast.success(`Import riuscito: ${ok} materiali salvati${fail ? `, ${fail} falliti` : ""}`);
      refetch();
    } else {
      toast.error("Nessun materiale importato con successo.");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <span>
                  <Plus className="hidden" />
                </span>
                Gestione Materiali
              </h1>
              <p className="text-muted-foreground mt-1">
                Catalogo e gestione materiali per costruzioni a secco
              </p>
            </div>

            {/* Filtri e ricerca + Import/Export */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Filtri e Ricerca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca per nome, codice o fornitore..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory | 'all')}
                      className="px-3 py-2 border border-input rounded-md text-sm"
                    >
                      {materialCategoryOptions.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-1">
                          Importa/Esporta <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleExportMaterials}>
                          Esporta materiali visibili (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setImportDialogOpen(true)}
                        >
                          Importa materiali da Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Materiale
                    </Button>
                  </div>
                </div>
                
                {(searchTerm || selectedCategory !== 'all') && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {filteredMaterials.length} materiali trovati
                    </span>
                    {searchTerm && (
                      <Badge variant="secondary">
                        Ricerca: "{searchTerm}"
                      </Badge>
                    )}
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary">
                        Categoria: {materialCategoryOptions.find(c => c.value === selectedCategory)?.label}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Riepilogo risparmio (solo se ci sono materiali con sconto) */}
            {(() => {
              const withDiscount = filteredMaterials.filter(m =>
                m.list_price != null && m.list_price > (m.unit_price ?? 0) + 0.001
              );
              if (withDiscount.length === 0) return null;
              const totalList = withDiscount.reduce((s, m) => s + (m.list_price ?? 0), 0);
              const totalNet  = withDiscount.reduce((s, m) => s + (m.unit_price ?? 0), 0);
              const savePct = totalList > 0 ? ((1 - totalNet / totalList) * 100) : 0;
              return (
                <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Stat label="Materiali con sconto" value={`${withDiscount.length} / ${filteredMaterials.length}`} />
                      <Stat label="Totale listino" value={`€ ${totalList.toFixed(2)}`} />
                      <Stat label="Totale netto" value={`€ ${totalNet.toFixed(2)}`} accent="text-green-700" />
                      <Stat label="Risparmio medio" value={`${savePct.toFixed(1)}%`} accent="text-green-700" />
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Tabella materiali */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Catalogo Materiali ({filteredMaterials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                    <span>Caricamento materiali...</span>
                  </div>
                ) : (
                  <MaterialsTable 
                    materials={sortedMaterials}
                    onEditMaterial={setEditingMaterial}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={setSort}
                  />
                )}
              </CardContent>
            </Card>

            {/* Dialogs */}
            <CreateMaterialDialog 
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSuccess={handleMaterialCreated}
            />

            {editingMaterial && (
              <EditMaterialDialog
                material={editingMaterial}
                open={!!editingMaterial}
                onOpenChange={(open) => !open && setEditingMaterial(null)}
                onSuccess={handleMaterialUpdated}
              />
            )}

            {/* Dialog import Excel */}
            {importDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xl relative">
                  <button
                    className="absolute right-3 top-3 text-xl"
                    onClick={() => {
                      setImportDialogOpen(false);
                      setImportPreview([]);
                      setImportErrors([]);
                    }}
                  >
                    ×
                  </button>
                  <h2 className="text-lg font-semibold mb-2">Importa materiali da Excel</h2>
                  <label className="block mb-2">Seleziona file Excel (.xlsx):</label>
                  <input
                    type="file"
                    accept=".xlsx"
                    className="mb-4"
                    onChange={handleImportFile}
                  />
                  {importErrors.length > 0 && (
                    <div className="mb-2 text-sm text-red-600">
                      {importErrors.map(err => (
                        <div key={err}>{err}</div>
                      ))}
                    </div>
                  )}
                  {importPreview.length > 0 && (
                    <div className="mb-4 max-h-52 overflow-auto">
                      <table className="w-full text-xs border rounded">
                        <thead>
                          <tr className="bg-gray-100">
                            <th>Codice</th>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Fornitore</th>
                            <th>PrezzoUn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((m, i) => (
                            <tr key={i} className="border-t">
                              <td>{m.code}</td>
                              <td>{m.name}</td>
                              <td>{m.category}</td>
                              <td>{m.supplier}</td>
                              <td>{m.unit_price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportDialogOpen(false);
                        setImportPreview([]);
                        setImportErrors([]);
                      }}
                      disabled={importing}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleSaveImport}
                      disabled={importing || importPreview.length === 0}
                    >
                      {importing ? "Importazione..." : "Importa e Salva"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Materials;
