
import React from 'react';
import { StructuralGroup } from '../utils/stratigraphyUtils';
import StructureLayer from './StructureLayer';
import InsulationLayer from './InsulationLayer';
import { getLayerActualThickness } from '../utils/stratigraphyUtils';

interface StructuralGroupRendererProps {
  group: StructuralGroup;
  startX: number;
  groupWidth: number;
  scale: number;
}

const StructuralGroupRenderer = ({ group, startX, groupWidth, scale }: StructuralGroupRendererProps) => {
  console.log('[StructuralGroupRenderer] 🏗️ RENDERING STRUCTURAL GROUP:', {
    groupWidth,
    scale,
    internalInsulationCount: group.internalInsulation.length
  });

  return (
    <g>
      {/* Render the main structure */}
      {group.structure && (
        <StructureLayer
          layer={group.structure}
          renderX={startX}
          layerWidth={groupWidth}
          associatedGuides={group.guides}
        />
      )}
      
      {/* Render internal insulation with correct proportional sizing */}
      {group.internalInsulation.map((insulation, index) => {
        const structureThickness = group.structure ? getLayerActualThickness(group.structure) : 100;
        const insulationThickness = getLayerActualThickness(insulation);
        
        // Calcola la larghezza proporzionale dell'isolante rispetto alla struttura
        const insulationWidth = (insulationThickness / structureThickness) * groupWidth;
        
        // Centra l'isolante nella struttura
        const centeredX = startX + (groupWidth - insulationWidth) / 2;
        
        console.log('[StructuralGroupRenderer] 🧱 INTERNAL INSULATION PROPORTIONS:', {
          structureThickness,
          insulationThickness,
          structureWidth: groupWidth,
          insulationWidth: insulationWidth.toFixed(1),
          ratio: (insulationThickness / structureThickness).toFixed(2),
          centeredX: centeredX.toFixed(1)
        });
        
        return (
          <InsulationLayer
            key={`internal-insulation-${insulation.id}`}
            layer={insulation}
            index={index}
            renderX={centeredX}
            insulationWidth={insulationWidth}
            isInternal={true}
          />
        );
      })}
    </g>
  );
};

export default StructuralGroupRenderer;
