
import React from "react";
import { MaterialFormData } from "./MaterialFormData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { boardTypologyOptions, boardMaterialOptions } from "./MaterialFormData";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import MaterialPricingSection from "./MaterialPricingSection";

interface ScrewMaterialFormProps {
  formData: MaterialFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaterialFormData>>;
  isSubmitting: boolean;
}

const ScrewMaterialForm = ({ formData, setFormData, isSubmitting }: ScrewMaterialFormProps) => {
  // Default: 25 se vuoto
  React.useEffect(() => {
    if (!formData.incidence_per_sqm) {
      setFormData(prev => ({ ...prev, incidence_per_sqm: "25" }));
    }
    // Default tempo posa se vuoto (per 25 viti/mq a 36 viti/min = 0.0278 min per vite)
    if (!formData.installation_time_per_sqm) {
      setFormData(prev => ({ ...prev, installation_time_per_sqm: "0.0278" }));
    }
  }, []);

  // Multi-select per materiali lastre (es. Gesso Rivestito, Silicato, Cemento)
  const selectedMaterials = React.useMemo(
    () =>
      (formData.compatible_board_types?.split(",").map(s => s.trim()).filter(Boolean)) || [],
    [formData.compatible_board_types]
  );

  const handleAddMaterial = (mat: string) => {
    if (!selectedMaterials.includes(mat)) {
      const joined = [...selectedMaterials, mat].join(", ");
      setFormData(prev => ({
        ...prev,
        compatible_board_types: joined
      }));
    }
  };

  const handleRemoveMaterial = (mat: string) => {
    const filtered = selectedMaterials.filter(t => t !== mat).join(", ");
    setFormData(prev => ({
      ...prev,
      compatible_board_types: filtered
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="code">Codice vite *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="name">Nome vite *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="supplier">Fornitore *</Label>
        <Input
          id="supplier"
          value={formData.supplier}
          onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Prezzi e Tempi - Utilizza il componente standardizzato */}
      <MaterialPricingSection
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      <div>
        <Label htmlFor="thickness">Lunghezza vite (mm)</Label>
        <Input
          id="thickness"
          type="number"
          value={formData.thickness}
          onChange={e => setFormData(prev => ({ ...prev, thickness: e.target.value }))}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="box_pieces">Numero a scatola *</Label>
        <Input
          id="box_pieces"
          type="number"
          min={1}
          value={formData.box_pieces ?? ""}
          onChange={e => setFormData(prev => ({ ...prev, box_pieces: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="incidence_per_sqm">Incidenza per mq *</Label>
        <Input
          id="incidence_per_sqm"
          type="number"
          min={1}
          value={formData.incidence_per_sqm ?? "25"}
          onChange={e => setFormData(prev => ({ ...prev, incidence_per_sqm: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="description">Descrizione</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label>
          Materiali lastre compatibili{" "}
          <span className="font-normal text-xs ml-2 text-gray-500">(scegli uno o più materiali dalla lista)</span>
        </Label>
        <div className="flex flex-col gap-2">
          <Select onValueChange={handleAddMaterial} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue>Seleziona materiale...</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {boardMaterialOptions
                .filter(opt => !selectedMaterials.includes(opt.value))
                .map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          {/* Selected pills/badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedMaterials.length === 0 && (
              <span className="text-xs text-muted-foreground">Nessuno selezionato</span>
            )}
            {selectedMaterials.map(mat =>
              <span
                key={mat}
                className="flex items-center px-2 py-1 rounded bg-accent text-xs cursor-pointer gap-1"
                style={{ background: "#eaf0fa"}}
                onClick={() => handleRemoveMaterial(mat)}
                title="Rimuovi"
              >
                {boardMaterialOptions.find(opt => opt.value === mat)?.label || mat}
                <span className="ml-1 text-muted-foreground">×</span>
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">Materiali delle lastre raccomandati per questa vite</span>
      </div>
    </div>
  );
};

export default ScrewMaterialForm;
