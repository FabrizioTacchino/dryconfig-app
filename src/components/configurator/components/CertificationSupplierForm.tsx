
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertifiedStratigraphyFormData } from '@/types/certification';

interface CertificationSupplierFormProps {
  formData: CertifiedStratigraphyFormData;
  onFormChange: (field: keyof CertifiedStratigraphyFormData, value: any) => void;
}

const CertificationSupplierForm = ({ formData, onFormChange }: CertificationSupplierFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dati Produttore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Nome Fornitore</Label>
            <Input
              id="supplier-name"
              value={formData.supplier_name || ''}
              onChange={(e) => onFormChange('supplier_name', e.target.value)}
              placeholder="Es. Knauf, Gyproc, ecc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution-code">Codice Soluzione</Label>
            <Input
              id="solution-code"
              value={formData.solution_code || ''}
              onChange={(e) => onFormChange('solution_code', e.target.value)}
              placeholder="Es. ABC-123"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="extension-code">Codice Estensione EXAP</Label>
            <Input
              id="extension-code"
              value={formData.extension_code || ''}
              onChange={(e) => onFormChange('extension_code', e.target.value)}
              placeholder="Es. EXAP-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalog-page">Pagina Catalogo</Label>
            <Input
              id="catalog-page"
              value={formData.catalog_page || ''}
              onChange={(e) => onFormChange('catalog_page', e.target.value)}
              placeholder="Es. Pag. 45"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationSupplierForm;
