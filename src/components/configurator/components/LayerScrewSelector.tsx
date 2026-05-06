
import React from 'react';
import { DatabaseMaterial } from '@/hooks/useMaterials';
import { Badge } from '@/components/ui/badge';

interface LayerScrewSelectorProps {
  recommendedScrew: DatabaseMaterial | null;
  availableScrews: DatabaseMaterial[];
  requiredLength: number;
  compatibleTypes: string[];
  quantityPerSqm: number;
  screwUnit: string;
  customScrewId?: string;
  customQuantity?: number;
  hasPreexistingScrew?: boolean;
  isEditMode?: boolean;
  onChange: (option: { screwId: string; quantity: number }) => void;
}

const LayerScrewSelector: React.FC<LayerScrewSelectorProps> = ({
  recommendedScrew,
  availableScrews,
  requiredLength,
  compatibleTypes,
  quantityPerSqm,
  screwUnit,
  customScrewId,
  customQuantity,
  hasPreexistingScrew = false,
  isEditMode = false,
  onChange
}) => {
  console.log('[LayerScrewSelector] 🔩 ENHANCED SCREW SELECTOR:', {
    customScrewId,
    customQuantity,
    hasPreexistingScrew,
    isEditMode,
    recommendedScrewName: recommendedScrew?.name,
    recommendedScrewCode: recommendedScrew?.code,
    availableScrewsCount: availableScrews.length,
    availableScrewNames: availableScrews.map(s => s.name),
    compatibleTypes
  });

  // Validation of custom props
  const validCustomScrewId = customScrewId && typeof customScrewId === 'string' && customScrewId.trim() !== '' ? customScrewId : undefined;
  const validCustomQuantity = customQuantity && typeof customQuantity === 'number' && customQuantity > 0 ? customQuantity : undefined;

  console.log('[LayerScrewSelector] ✅ VALIDATED PROPS:', {
    validCustomScrewId,
    validCustomQuantity,
    isValidConfig: !!(validCustomScrewId && validCustomQuantity)
  });

  // Filter compatible screws based on length and type requirements
  const compatibleScrews = availableScrews.filter(vite => {
    const viteLength = vite.length ?? vite.thickness ?? 0;
    const typeCompat = Array.isArray(vite.compatible_board_types)
      ? vite.compatible_board_types.some(t => compatibleTypes.includes(t))
      : false;
    const isCompatible = viteLength >= requiredLength && typeCompat;
    
    if (isCompatible) {
      console.log('[LayerScrewSelector] ✅ COMPATIBLE SCREW:', {
        screwName: vite.name,
        screwCode: vite.code,
        length: viteLength,
        compatibleTypes: vite.compatible_board_types,
        requiredTypes: compatibleTypes
      });
    }
    
    return isCompatible;
  });

  // Find custom screw in database
  const customScrewInDatabase = validCustomScrewId ? 
    availableScrews.find(s => s.id === validCustomScrewId) : null;

  console.log('[LayerScrewSelector] 🔍 CUSTOM SCREW ANALYSIS:', {
    customScrewId: validCustomScrewId,
    foundInDB: !!customScrewInDatabase,
    screwName: customScrewInDatabase?.name,
    screwCode: customScrewInDatabase?.code
  });

  // All available screws for manual selection
  const allAvailableScrews = availableScrews.filter(s => s.category === 'screw');

  // Check if custom screw is still compatible
  const isCustomScrewCompatible = customScrewInDatabase ? 
    compatibleScrews.find(s => s.id === validCustomScrewId) : false;

  const getStatusMessage = () => {
    if (isEditMode && customScrewInDatabase && validCustomQuantity) {
      return `Vite salvata: ${customScrewInDatabase.name} (${validCustomQuantity}/${screwUnit})`;
    }
    
    if (isEditMode && validCustomScrewId && !customScrewInDatabase) {
      return "Vite precedentemente assegnata non più disponibile";
    }
    
    if (isEditMode && !validCustomScrewId) {
      return "Nessuna vite precedentemente assegnata";
    }
    
    if (hasPreexistingScrew && customScrewInDatabase) {
      return `Vite configurata: ${customScrewInDatabase.name}`;
    }
    
    if (hasPreexistingScrew && customScrewId && !customScrewInDatabase) {
      return "Vite precedente non trovata nel database";
    }
    
    if (hasPreexistingScrew && !customScrewId) {
      return "Nessuna vite precedente trovata";
    }
    
    if (recommendedScrew) {
      return `Vite consigliata: ${recommendedScrew.name} (${recommendedScrew.code || 'N/A'})`;
    }
    
    return "Nessuna vite consigliata trovata";
  };

  const getStatusColor = () => {
    if (isEditMode && customScrewInDatabase) {
      return isCustomScrewCompatible ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100";
    }
    
    if (isEditMode && customScrewId && !customScrewInDatabase) {
      return "text-red-700 bg-red-100";
    }
    
    if (isEditMode && !customScrewId) {
      return "text-blue-700 bg-blue-100";
    }
    
    if (hasPreexistingScrew && customScrewInDatabase) {
      return isCustomScrewCompatible ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100";
    }
    
    if (hasPreexistingScrew && customScrewId && !customScrewInDatabase) {
      return "text-red-700 bg-red-100";
    }
    
    if (hasPreexistingScrew && !customScrewId) {
      return "text-orange-700 bg-orange-100";
    }
    
    if (recommendedScrew) {
      return "text-green-700 bg-green-100"; // Changed from yellow to green for recommended
    }
    
    return "text-blue-700 bg-blue-100";
  };

  // Determine currently selected screw
  const currentlySelectedScrew = customScrewInDatabase || recommendedScrew;
  const currentQuantity = validCustomQuantity ?? quantityPerSqm;

  console.log('[LayerScrewSelector] 🎯 FINAL STATUS:', {
    currentlySelectedScrew: currentlySelectedScrew?.name,
    currentlySelectedCode: currentlySelectedScrew?.code,
    currentQuantity,
    isValidSelection: !!(currentlySelectedScrew && currentQuantity),
    compatibleScrewsCount: compatibleScrews.length,
    statusMessage: getStatusMessage()
  });

  return (
    <div className="flex flex-col gap-1 border rounded p-2 bg-yellow-50 border-yellow-200 mt-2 mb-2">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className={`${getStatusColor()} px-2 py-0.5`}>
          {getStatusMessage()}
        </Badge>
        <span className="block">
          Quantità proposta: <b>{currentQuantity}</b>/{screwUnit}
        </span>
        <span className="ml-2 block">
          Lunghezza minima: {requiredLength} mm • {compatibleTypes.join(', ')}
        </span>
      </div>
      
      {/* Enhanced debug info */}
      {recommendedScrew && (
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          🎯 Sistema intelligente: {recommendedScrew.name} ({recommendedScrew.code}) compatibile con {compatibleTypes.join(', ')}
        </div>
      )}
      
      {allAvailableScrews.length === 0 ? (
        <div className="text-xs text-red-700 font-semibold px-2 py-1">
          ⚠ Nessuna vite disponibile nel database
        </div>
      ) : (
        <>
          {isEditMode && customScrewInDatabase && !isCustomScrewCompatible && (
            <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
              ⚠ La vite salvata potrebbe non essere più completamente compatibile. Verifica manualmente.
            </div>
          )}
          
          {compatibleScrews.length === 0 && !customScrewInDatabase && (
            <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
              ⚠ Nessuna vite completamente compatibile trovata. Selezione manuale disponibile.
            </div>
          )}
          
          <div className="flex gap-2 pt-1">
            <label className="text-xs font-medium text-gray-600">Tipo:</label>
            <select
              value={customScrewId || (recommendedScrew?.id ?? '')}
              onChange={e => {
                console.log('[LayerScrewSelector] 🔄 SCREW SELECTION CHANGED:', {
                  newScrewId: e.target.value,
                  previousScrewId: customScrewId,
                  recommendedScrewId: recommendedScrew?.id
                });
                onChange({
                  screwId: e.target.value,
                  quantity: currentQuantity
                });
              }}
              className="text-xs border rounded px-1 py-0.5 bg-white"
            >
              {!customScrewId && !recommendedScrew && (
                <option value="">-- Seleziona vite --</option>
              )}
              
              {/* Prioritize compatible screws */}
              {compatibleScrews.length > 0 ? (
                <optgroup label={`🎯 Viti compatibili (${compatibleTypes.join(', ')})`}>
                  {compatibleScrews.map(vite => (
                    <option value={vite.id} key={`compatible-${vite.id}`}>
                      {vite.name} ({vite.code}) - {vite.length ?? vite.thickness ?? '-'} mm - €{vite.unit_price.toFixed(3)}/pz
                    </option>
                  ))}
                </optgroup>
              ) : (
                <optgroup label="⚠️ Nessuna vite compatibile - Verificare manualmente">
                  {allAvailableScrews.map(vite => (
                    <option value={vite.id} key={`all-${vite.id}`}>
                      {vite.name} ({vite.code}) - {vite.length ?? vite.thickness ?? '-'} mm - €{vite.unit_price.toFixed(3)}/pz [VERIFICA]
                    </option>
                  ))}
                </optgroup>
              )}
              
              {/* Show previously selected incompatible screw */}
              {isEditMode && customScrewInDatabase && !isCustomScrewCompatible && (
                <optgroup label="⚠️ Vite Precedentemente Selezionata">
                  <option value={customScrewInDatabase.id}>
                    {customScrewInDatabase.name} ({customScrewInDatabase.code}) - {customScrewInDatabase.length ?? customScrewInDatabase.thickness ?? '-'} mm - €{customScrewInDatabase.unit_price.toFixed(3)}/pz [VERIFICA]
                  </option>
                </optgroup>
              )}
            </select>
          </div>
          
          <div className="flex gap-2 pt-1">
            <label className="text-xs font-medium text-gray-600">Quantità viti/m²:</label>
            <input
              type="number"
              min={1}
              style={{ maxWidth: 80 }}
              className="border rounded px-1 py-0.5 text-xs"
              value={currentQuantity}
              onChange={e => {
                const newQuantity = parseInt(e.target.value) || 1;
                console.log('[LayerScrewSelector] 🔢 QUANTITY CHANGED:', {
                  newQuantity,
                  previousQuantity: currentQuantity,
                  screwId: customScrewId || recommendedScrew?.id
                });
                onChange({
                  screwId: customScrewId || (recommendedScrew?.id ?? ''),
                  quantity: newQuantity
                });
              }}
            />
            <span className="text-xs text-gray-400">{screwUnit || 'pz'}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default LayerScrewSelector;
