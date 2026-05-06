
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Filter } from 'lucide-react';
import { DatabaseMaterial } from '@/hooks/useMaterials';

interface SupplierFilterProps {
  materials: DatabaseMaterial[];
  selectedSupplier: string;
  onSupplierChange: (supplier: string) => void;
}

const SupplierFilter = ({ materials, selectedSupplier, onSupplierChange }: SupplierFilterProps) => {
  // Extract unique suppliers and count materials per supplier, filtering out empty suppliers
  const supplierCounts = materials.reduce((acc, material) => {
    const supplier = material.supplier;
    // Skip materials with empty, null, or undefined suppliers
    if (supplier && supplier.trim() !== '') {
      acc[supplier] = (acc[supplier] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const suppliers = Object.keys(supplierCounts).sort();
  const totalMaterials = materials.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtro Fornitore
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Select value={selectedSupplier} onValueChange={onSupplierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona fornitore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Tutti i fornitori</span>
                  <Badge variant="outline" className="ml-auto">
                    {totalMaterials}
                  </Badge>
                </div>
              </SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier} value={supplier}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{supplier}</span>
                    <Badge variant="outline" className="ml-auto">
                      {supplierCounts[supplier]}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSupplier && selectedSupplier !== 'all' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                <strong>Fornitore selezionato:</strong> {selectedSupplier}
                <br />
                <span className="text-blue-600">
                  {supplierCounts[selectedSupplier]} materiali disponibili
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierFilter;
