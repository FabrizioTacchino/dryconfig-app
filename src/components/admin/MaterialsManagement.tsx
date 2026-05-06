
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type Material = Database['public']['Tables']['materials']['Row'];
type MaterialCategory = Database['public']['Enums']['material_category'];

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'board' as MaterialCategory,
    supplier: '',
    unit: '',
    unit_price: '',
    incidence_per_sqm: '',
    discount: '',
    description: '',
    valid_until: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Errore nel caricamento dei materiali');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const materialData = {
        ...formData,
        unit_price: parseFloat(formData.unit_price) || 0,
        incidence_per_sqm: formData.incidence_per_sqm ? parseFloat(formData.incidence_per_sqm) : null,
        discount: formData.discount || null,
        valid_until: formData.valid_until || null
      };

      if (editingMaterial) {
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success('Materiale aggiornato con successo');
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([materialData]);

        if (error) throw error;
        toast.success('Materiale creato con successo');
      }

      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Errore nel salvataggio del materiale');
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      code: material.code,
      category: material.category,
      supplier: material.supplier,
      unit: material.unit,
      unit_price: material.unit_price.toString(),
      incidence_per_sqm: material.incidence_per_sqm?.toString() || '',
      discount: material.discount?.toString() || '',
      description: material.description || '',
      valid_until: material.valid_until || ''
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = (material: Material) => {
    setDeletingMaterial(material);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMaterial) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', deletingMaterial.id);

      if (error) throw error;
      toast.success('Materiale eliminato con successo');
      setDeletingMaterial(null);
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Errore nell\'eliminazione del materiale');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: 'board',
      supplier: '',
      unit: '',
      unit_price: '',
      incidence_per_sqm: '',
      discount: '',
      description: '',
      valid_until: ''
    });
    setEditingMaterial(null);
    setShowAddForm(false);
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (category: MaterialCategory) => {
    const labels = {
      board: 'Pannello',
      structure_frame: 'Struttura - Montanti',
      structure_guide: 'Struttura - Guide',
      insulation: 'Isolamento',
      accessory: 'Accessorio',
      screw: 'Vite',
      other: 'Altro'
    };
    return labels[category];
  };

  const getCategoryColor = (category: MaterialCategory) => {
    const colors = {
      board: 'bg-blue-100 text-blue-800',
      structure_frame: 'bg-green-100 text-green-800',
      structure_guide: 'bg-green-100 text-green-800',
      insulation: 'bg-yellow-100 text-yellow-800',
      accessory: 'bg-purple-100 text-purple-800',
      screw: 'bg-orange-100 text-orange-800',
      other: 'bg-muted text-muted-foreground'
    };
    return colors[category];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca materiali..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Aggiungi Materiale
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMaterial ? 'Modifica Materiale' : 'Nuovo Materiale'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Codice *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value: MaterialCategory) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="board">Lastre</SelectItem>
                      <SelectItem value="structure_frame">Struttura - Montanti</SelectItem>
                      <SelectItem value="structure_guide">Struttura - Guide</SelectItem>
                      <SelectItem value="insulation">Isolanti</SelectItem>
                      <SelectItem value="accessory">Accessori</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier">Fornitore *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unità di misura *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="es. mq, ml, pz"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Prezzo unitario (€) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="incidence_per_sqm">Incidenza per mq</Label>
                  <Input
                    id="incidence_per_sqm"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.incidence_per_sqm}
                    onChange={(e) => setFormData({ ...formData, incidence_per_sqm: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Sconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valido fino a</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingMaterial ? 'Aggiorna' : 'Crea'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <p>Caricamento materiali...</p>
        ) : filteredMaterials.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? 'Nessun materiale trovato con i criteri di ricerca.' : 'Nessun materiale presente.'}
          </p>
        ) : (
          filteredMaterials.map((material) => (
            <Card key={material.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{material.name}</h3>
                      <Badge className={getCategoryColor(material.category)}>
                        {getCategoryLabel(material.category)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Codice: {material.code}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fornitore:</span>
                        <p className="font-medium">{material.supplier}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prezzo:</span>
                        <p className="font-medium">€{material.unit_price.toFixed(2)}/{material.unit}</p>
                      </div>
                      {material.incidence_per_sqm && (
                        <div>
                          <span className="text-muted-foreground">Incidenza/mq:</span>
                          <p className="font-medium">{material.incidence_per_sqm}</p>
                        </div>
                      )}
                      {material.discount && (
                        <div>
                          <span className="text-muted-foreground">Sconto:</span>
                          <p className="font-medium">{material.discount}%</p>
                        </div>
                      )}
                    </div>
                    {material.description && (
                      <p className="text-sm text-muted-foreground mt-2">{material.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingMaterial} onOpenChange={() => setDeletingMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il materiale "{deletingMaterial?.name}"?
              <br />
              <strong>Questa azione non può essere annullata.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MaterialsManagement;
