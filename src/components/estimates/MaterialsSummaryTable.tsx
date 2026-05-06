import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, FileSpreadsheet, FileText, Package, ArrowUpDown } from 'lucide-react';
import { MaterialSummaryItem } from '@/hooks/useMaterialsSummary';
import { exportMaterialsSummaryToExcel } from '@/utils/export/exportMaterialsSummaryExcel';
import { exportMaterialsSummaryToPDF } from '@/utils/export/exportMaterialsSummaryPDF';
import { exportCompleteRDA } from '@/utils/export/exportCompleteRDA';
import { toast } from 'sonner';

interface MaterialsSummaryTableProps {
  materials: MaterialSummaryItem[];
  totalCost: number;
  totalLaborCost: number;
  totalByCategory: Record<string, number>;
  estimateName?: string;
  estimate?: any;
  stratigraphies?: any[];
}

const MaterialsSummaryTable = ({ 
  materials, 
  totalCost, 
  totalLaborCost, 
  totalByCategory,
  estimateName = 'Preventivo',
  estimate,
  stratigraphies = []
}: MaterialsSummaryTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof MaterialSummaryItem>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtri
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Ordinamento
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const categories = [...new Set(materials.map(m => m.category))].sort();

  const handleSort = (field: keyof MaterialSummaryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calcolo totale preventivo
  const totalEstimate = totalCost + totalLaborCost;

  const handleExportExcel = () => {
    try {
      exportMaterialsSummaryToExcel(materials, estimateName, totalCost, totalLaborCost);
      toast.success('Export Excel completato', {
        description: 'Il file Excel è stato scaricato con successo.'
      });
    } catch (error) {
      console.error('Errore durante export Excel:', error);
      toast.error('Errore durante export Excel', {
        description: 'Si è verificato un errore durante la generazione del file.'
      });
    }
  };

  const handleExportPDF = () => {
    try {
      exportMaterialsSummaryToPDF(materials, estimateName, totalCost, totalLaborCost);
      toast.success('Export PDF completato', {
        description: 'Il file PDF è stato scaricato con successo.'
      });
    } catch (error) {
      console.error('Errore durante export PDF:', error);
      toast.error('Errore durante export PDF', {
        description: 'Si è verificato un errore durante la generazione del file.'
      });
    }
  };

  const handleExportCompleteRDA = async () => {
    if (!estimate || !stratigraphies.length) {
      toast.error('Dati mancanti', {
        description: 'Impossibile generare RDA Completa: mancano i dati del preventivo o delle stratigrafie.'
      });
      return;
    }

    try {
      await exportCompleteRDA(estimate, stratigraphies);
      toast.success('RDA Completa generata con successo!', {
        description: 'Il documento completo con tutte le stratigrafie è stato scaricato.'
      });
    } catch (error) {
      console.error('Errore export RDA Completa:', error);
      toast.error('Errore durante la generazione RDA Completa', {
        description: 'Si è verificato un errore durante la generazione del documento.'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtri e Ricerca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca materiali..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtra per categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category} (€{totalByCategory[category]?.toFixed(2) || '0.00'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            Esporta Dati in Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <FileText className="h-4 w-4" />
            Stampa RDA
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportCompleteRDA}>
            <FileText className="h-4 w-4" />
            Stampa RDA Completa
          </Button>
        </div>
      </div>

      {/* Statistiche Rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Totale Materiali</span>
          </div>
          <p className="text-2xl font-bold">{materials.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Costo Totale</span>
          </div>
          <p className="text-2xl font-bold text-primary">€{totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Fornitori</span>
          </div>
          <p className="text-2xl font-bold">{new Set(materials.map(m => m.supplier)).size}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Categorie</span>
          </div>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
      </div>

      {/* Tabella */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('category')} className="h-8 p-2">
                  Categoria
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('materialName')} className="h-8 p-2">
                  Materiale
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('supplier')} className="h-8 p-2">
                  Fornitore
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('totalQuantity')} className="h-8 p-2">
                  Quantità
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('unitPrice')} className="h-8 p-2">
                  Prezzo Unit.
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('totalCost')} className="h-8 p-2">
                  Totale
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMaterials.map((material, index) => (
              <TableRow key={`${material.materialId}-${index}`}>
                <TableCell>
                  <Badge variant="outline">{material.category}</Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{material.materialName}</div>
                    <div className="text-sm text-muted-foreground">
                      {material.materialCode && `Cod: ${material.materialCode}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Usato in: {material.stratigraphyNames.join(', ')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{material.supplier}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">
                    {material.totalQuantity.toFixed(2)} {material.unit}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm">
                    €{material.unitPrice.toFixed(2)}/{material.unit}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">
                    €{material.totalCost.toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totali - Tre box affiancati */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Costo Totale Materiali</div>
            <div className="text-2xl font-bold text-blue-700">€{totalCost.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Costo Totale Manodopera</div>
            <div className="text-2xl font-bold text-green-700">€{totalLaborCost.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Totale Preventivo</div>
            <div className="text-2xl font-bold text-primary">€{totalEstimate.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsSummaryTable;
