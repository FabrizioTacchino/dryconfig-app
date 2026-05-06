
import React from "react";
import { DatabaseMaterial } from "@/hooks/useMaterials";

interface MaterialDimensionsCellProps {
  material: DatabaseMaterial;
}

// Ritorna una cella dimensioni coerente per ogni categoria materiale
const MaterialDimensionsCell: React.FC<MaterialDimensionsCellProps> = ({ material }) => {
  if (material.category === "screw") {
    return <>{material.thickness ? `Lunghezza: ${material.thickness} mm` : "-"}</>;
  }
  if (material.category === "board") {
    return (
      <div className="text-sm">
        {material.width && material.length && material.thickness && (
          <div>
            {material.width} × {material.length} × {material.thickness} mm
          </div>
        )}
        {material.density && (
          <div className="text-muted-foreground">Densità: {material.density} kg/m³</div>
        )}
      </div>
    );
  }
  if (material.category === "other") {
    if (material.is_variable_thickness) {
      return <>Spessore variabile</>;
    }
    return <>{material.thickness ? `${material.thickness} mm` : "-"}</>;
  }
  return <>{material.thickness ? `${material.thickness} mm` : "-"}</>;
};

export default MaterialDimensionsCell;
