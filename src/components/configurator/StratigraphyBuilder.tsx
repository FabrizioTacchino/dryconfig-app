import React from 'react';
import { useCreateStratigraphy, useUpdateStratigraphy } from '@/hooks/useStratigraphyActions';
import { useUpdateEstimateStratigraphy } from '@/hooks/useUpdateEstimateStratigraphy';
import { toast } from 'sonner';
import PersonalizedStratigraphyFormContainer from './components/PersonalizedStratigraphyFormContainer';
import { DatabaseStratigraphy } from '@/hooks/useStratigraphies';
import { EstimateStratigraphy } from '@/types/estimateStratigraphy';

// Helper type guard
function isEstimateStratigraphy(
  strat: DatabaseStratigraphy | EstimateStratigraphy | null | undefined
): strat is EstimateStratigraphy {
  // Ensure the presence of isSnapshot (camelCase - as per type definition)
  return !!strat && typeof (strat as any).isSnapshot === 'boolean';
}

interface StratigraphyBuilderProps {
  estimateId?: string;
  editingStratigraphy?: DatabaseStratigraphy | EstimateStratigraphy | null;
  initialStratigraphyId?: string;
  viewOnly?: boolean;
}

const StratigraphyBuilder = ({
  estimateId,
  editingStratigraphy,
  initialStratigraphyId,
  viewOnly = false,
}: StratigraphyBuilderProps) => {
  const { mutate: createStratigraphy, isPending: isCreating } = useCreateStratigraphy();
  const { mutate: updateStratigraphy, isPending: isUpdatingGeneral } = useUpdateStratigraphy();
  const { updateEstimateStratigraphy, isUpdating: isUpdatingEstimate } = useUpdateEstimateStratigraphy(
    []
  );
  const isSaving = isCreating || isUpdatingGeneral || isUpdatingEstimate;

  React.useEffect(() => {
    if (!editingStratigraphy && !!initialStratigraphyId) {
      console.warn('[StratigraphyBuilder] Nessun dato di editingStratigraphy per id:', initialStratigraphyId);
    }
  }, [editingStratigraphy, initialStratigraphyId]);

  const handleSave = async (formData: any) => {
    // Aggiunto logging completo delle variabili chiave
    console.log('[StratigraphyBuilder][DEBUG] formData:', formData);
    console.log('[StratigraphyBuilder][DEBUG] editingStratigraphy:', editingStratigraphy);

    // Identifica robustamente la snapshot tramite type guard
    const isEstimateSnapshot = isEstimateStratigraphy(editingStratigraphy)
      ? editingStratigraphy.isSnapshot
      : false;

    console.log('[StratigraphyBuilder][DEBUG] isEstimateSnapshot:', isEstimateSnapshot);

    if (isEstimateSnapshot) {
      const estimateStratigraphy = editingStratigraphy as EstimateStratigraphy;
      const updatePayload: any = {};

      // --------- Salvo sempre i layers IN FORMATO COMPLETO
      // Costruisco le varianti accettate (legacy per compatibilità + layers completi)
      // Cerca il campo più ricco su formData
      let incomingLayers =
        formData.layersData ||
        formData.layers_data ||
        formData.layers ||
        [];

      // Normalizza per sicurezza e serializza con campi materiale
      const parsedLayers = Array.isArray(incomingLayers)
        ? incomingLayers.map((l, idx) => ({
            material_id: l.material_id || l.materialId || '',
            thickness: l.thickness,
            position: l.position || idx + 1,
            inter_axis: l.inter_axis !== undefined ? l.inter_axis : l.interAxis,
            // Qui serializzo SEMPRE i dati del materiale
            material: l.material ? { ...l.material } : l.materials ? { ...l.materials } : undefined,
            materials: l.materials ? { ...l.materials } : l.material ? { ...l.material } : undefined,
          }))
        : [];

      updatePayload.layersData = parsedLayers;
      updatePayload.layers_data = parsedLayers;

      // Popola anche i campi snapshot base (compresi area, name, description)
      if ('area' in formData) updatePayload.area = formData.area;
      if ('name' in formData) updatePayload.name = formData.name;
      if ('description' in formData) updatePayload.description = formData.description;

      // Calcolo costi come prima
      if ('unitCost' in formData) updatePayload.unitCost = formData.unitCost;
      else if ('cost_per_sqm' in formData) updatePayload.unitCost = formData.cost_per_sqm;

      if ('totalCost' in formData) updatePayload.totalCost = formData.totalCost;
      else if (
        (updatePayload.area ?? estimateStratigraphy.area) > 0 &&
        (updatePayload.unitCost ?? estimateStratigraphy.unitCost) >= 0
      ) {
        const area = updatePayload.area ?? estimateStratigraphy.area;
        const unitCost = updatePayload.unitCost ?? estimateStratigraphy.unitCost;
        updatePayload.totalCost = area * unitCost;
      }

      updatePayload.pricesUpdatedAt = new Date().toISOString();

      // Logging finale su dati che andranno all'update
      console.log('[StratigraphyBuilder][DEBUG] Update payload finale per snapshot:', {
        id: estimateStratigraphy.id,
        ...updatePayload,
      });

      // Controllo che id sia coerente e unico
      if (!estimateStratigraphy.id || typeof estimateStratigraphy.id !== 'string') {
        console.error('[StratigraphyBuilder][ERRORE] id della stratigrafia snapshot non valido:', estimateStratigraphy.id);
        toast.error('Errore interno: id stratigrafia snapshot non valido');
        return;
      }

      // Chiamata alla mutation
      updateEstimateStratigraphy(estimateStratigraphy.id, updatePayload);

      // Notifica di completamento (o usa quella in onSuccess)
      return;
    }

    // Se non snapshot, aggiorna stratigrafia generale
    const isUpdateOperation = !!(editingStratigraphy || formData.id);
    if (isUpdateOperation) {
      const stratigraphyId = formData.id || (editingStratigraphy as DatabaseStratigraphy)?.id;
      if (!stratigraphyId) {
        toast.error('Errore: ID stratigrafia non trovato per l\'aggiornamento');
        return;
      }
      const { id, ...updateData } = formData;
      updateStratigraphy(
        { id: stratigraphyId, ...updateData },
        {
          onSuccess: () => {
            toast.success('Stratigrafia aggiornata con successo!');
          },
          onError: (error) => {
            toast.error(`Errore durante l'aggiornamento: ${error.message}`);
          },
        }
      );
    } else {
      // Nuova stratigrafia generale
      createStratigraphy(
        formData,
        {
          onSuccess: () => {
            toast.success('Stratigrafia creata con successo!');
          },
          onError: (error) => {
            toast.error(`Errore durante la creazione: ${error.message}`);
          },
        }
      );
    }
  };

  return (
    <PersonalizedStratigraphyFormContainer 
      onSave={handleSave}
      isSaving={isSaving}
      editingStratigraphy={editingStratigraphy}
      viewOnly={viewOnly}
    />
  );
};

export default StratigraphyBuilder;
