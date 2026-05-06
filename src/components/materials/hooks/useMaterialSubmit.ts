
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MaterialFormData } from '../forms/MaterialFormData';
import { applyCumulativeDiscounts } from '@/utils/discountUtils';

export const useMaterialSubmit = (onOpenChange: (open: boolean) => void, onSuccess: () => void) => {
  const queryClient = useQueryClient();

  const { mutate: submitMaterial, isPending: isSubmitting } = useMutation({
    mutationFn: async (formData: MaterialFormData & { id?: string }) => {
      console.log('[useMaterialSubmit] 🚀 SUBMITTING MATERIAL:', formData);

      // Calcola il prezzo finale se sono presenti prezzo di listino e sconto
      let finalUnitPrice = parseFloat(formData.unit_price || '0');
      
      if (formData.list_price && formData.discount) {
        const listPrice = parseFloat(formData.list_price);
        if (!isNaN(listPrice)) {
          // Prima applica gli sconti
          let discountedPrice = applyCumulativeDiscounts(listPrice, formData.discount);
          
          // Poi aggiungi sfrido e discarica
          const wastePercentage = parseFloat(formData.waste_percentage || '0');
          const disposalPercentage = parseFloat(formData.disposal_percentage || '0');
          
          const wasteAmount = (discountedPrice * wastePercentage) / 100;
          const disposalAmount = (discountedPrice * disposalPercentage) / 100;
          
          finalUnitPrice = discountedPrice + wasteAmount + disposalAmount;
          
          console.log('[useMaterialSubmit] 💰 CALCULATED FINAL PRICE WITH WASTE/DISPOSAL:', {
            listPrice,
            discount: formData.discount,
            discountedPrice: discountedPrice.toFixed(4),
            wastePercentage,
            wasteAmount: wasteAmount.toFixed(4),
            disposalPercentage,
            disposalAmount: disposalAmount.toFixed(4),
            finalUnitPrice: finalUnitPrice.toFixed(4)
          });
        }
      } else if (formData.list_price && !formData.discount) {
        // Se c'è solo il prezzo di listino senza sconto, usalo come base e aggiungi sfrido/discarica
        const listPrice = parseFloat(formData.list_price);
        if (!isNaN(listPrice)) {
          const wastePercentage = parseFloat(formData.waste_percentage || '0');
          const disposalPercentage = parseFloat(formData.disposal_percentage || '0');
          
          const wasteAmount = (listPrice * wastePercentage) / 100;
          const disposalAmount = (listPrice * disposalPercentage) / 100;
          
          finalUnitPrice = listPrice + wasteAmount + disposalAmount;
        }
      }

      // Prepara i dati per l'inserimento/aggiornamento
      const materialData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        supplier: formData.supplier,
        thickness: formData.thickness ? parseFloat(formData.thickness) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        weight_per_sqm: formData.weight_per_sqm ? parseFloat(formData.weight_per_sqm) : null,
        unit_price: finalUnitPrice, // Mantieni la precisione originale
        list_price: formData.list_price ? parseFloat(formData.list_price) : null,
        discount: formData.discount || null,
        unit: formData.unit,
        thermal_conductivity: formData.thermal_conductivity ? parseFloat(formData.thermal_conductivity) : null,
        acoustic_performance: formData.acoustic_performance ? parseFloat(formData.acoustic_performance) : null,
        fire_resistance_class: formData.fire_resistance_class || null,
        color_hex: formData.color_hex || '#CCCCCC',
        incidence_base: formData.incidence_base ? parseFloat(formData.incidence_base) : null,
        incidence_per_sqm: formData.incidence_per_sqm ? parseFloat(formData.incidence_per_sqm) : 1,
        installation_time_per_sqm: formData.installation_time_per_sqm ? parseFloat(formData.installation_time_per_sqm) : null,
        // Campi specifici per categoria
        passo: formData.passo ? parseFloat(formData.passo) : null,
        material_type: formData.material_type || null,
        board_typology: formData.board_typology || null,
        density: formData.density ? parseFloat(formData.density) : null,
        flexural_strength: formData.flexural_strength || null,
        surface_hardness: formData.surface_hardness || null,
        en_520_type: formData.en_520_type || null,
        water_absorption: formData.water_absorption || null,
        humidity_resistance_class: formData.humidity_resistance_class || null,
        environmental_certification: formData.environmental_certification || null,
        recycled_content: formData.recycled_content ? parseFloat(formData.recycled_content) : null,
        voc_class: formData.voc_class || null,
        rei_compatible: formData.rei_compatible === 'true',
        intended_use: Array.isArray(formData.intended_use) ? formData.intended_use : [formData.intended_use].filter(Boolean),
        installation_notes: formData.installation_notes || null,
        fire_class: formData.fire_class || null,
        fire_description: formData.fire_description || null,
        board_type: formData.board_type || null,
        fire_usage_notes: formData.fire_usage_notes || null,
        sheet_thickness: formData.sheet_thickness ? parseFloat(formData.sheet_thickness) : null,
        weight_per_ml: formData.weight_per_ml ? parseFloat(formData.weight_per_ml) : null,
        profile_type: formData.profile_type || null,
        surface_finish: formData.surface_finish || null,
        // Campi per "Altro"
        is_variable_thickness: formData.is_variable_thickness || false,
        mechanical_performance: formData.mechanical_performance || null,
        thermal_performance_notes: formData.thermal_performance_notes || null,
        sustainability_notes: formData.sustainability_notes || null,
        system_compatibility: formData.system_compatibility || null,
        fire_performance_notes: formData.fire_performance_notes || null,
        carbon_footprint: formData.carbon_footprint || null,
        epd: formData.epd || null,
        vapor_permeability: formData.vapor_permeability || null,
        thermal_capacity: formData.thermal_capacity || null,
        // Campi per viti
        box_pieces: formData.box_pieces ? parseInt(formData.box_pieces) : null,
        compatible_board_types: formData.compatible_board_types ? 
          formData.compatible_board_types.split(',').map(s => s.trim()).filter(Boolean) : null,
        // Campi per sfrido e discarica
        waste_percentage: formData.waste_percentage ? parseFloat(formData.waste_percentage) : 10,
        disposal_percentage: formData.disposal_percentage ? parseFloat(formData.disposal_percentage) : 4,
      };

      console.log('[useMaterialSubmit] 📊 PREPARED DATA:', materialData);

      let result;
      if (formData.id) {
        // Aggiornamento
        const { data, error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', formData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        console.log('[useMaterialSubmit] ✅ MATERIAL UPDATED:', result);
      } else {
        // Creazione
        const { data, error } = await supabase
          .from('materials')
          .insert(materialData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        console.log('[useMaterialSubmit] ✅ MATERIAL CREATED:', result);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Materiale salvato con successo!');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error('[useMaterialSubmit] ❌ ERROR:', error);
      toast.error('Errore nel salvare il materiale: ' + error.message);
    },
  });

  return { submitMaterial, isSubmitting };
};
