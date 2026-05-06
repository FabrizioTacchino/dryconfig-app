import React from "react";
import { DatabaseMaterial } from "@/hooks/useMaterials";

interface MaterialDetailsCellProps {
  material: DatabaseMaterial;
}

const MaterialDetailsCell: React.FC<MaterialDetailsCellProps> = ({ material }) => {
  // Board (Lastra)
  if (material.category === "board") {
    return (
      <div>
        <div className="font-medium">{material.name}</div>
        {material.material_type && (
          <div className="text-sm text-muted-foreground">
            Tipo: {material.material_type}
          </div>
        )}
        {material.fire_class && (
          <div className="text-sm text-muted-foreground">
            Classe fuoco: {material.fire_class}
          </div>
        )}
        {material.description && (
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {material.description}
          </div>
        )}
      </div>
    );
  }
  // Screw (Vite)
  if (material.category === "screw") {
    return (
      <div>
        <div className="font-medium">{material.name}</div>
        {material.box_pieces && (
          <div className="text-xs text-blue-800 font-mono">
            {material.box_pieces} pz/scatola
          </div>
        )}
        {Array.isArray(material.compatible_board_types) && material.compatible_board_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {material.compatible_board_types.map((matType, i) => (
              <span
                key={i}
                className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
              >
                {matType}
              </span>
            ))}
          </div>
        )}
        {material.description && (
          <div className="text-xs text-muted-foreground mt-1">
            {material.description}
          </div>
        )}
      </div>
    );
  }
  // Other
  if (material.category === "other") {
    return (
      <div>
        <div className="font-medium">{material.name}</div>
        {material.description && (
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {material.description}
          </div>
        )}
        {material.mechanical_performance && (
          <div className="text-xs text-teal-700">Meccaniche: {material.mechanical_performance}</div>
        )}
        {material.thermal_performance_notes && (
          <div className="text-xs text-blue-700">Termo-igrometriche: {material.thermal_performance_notes}</div>
        )}
        {material.sustainability_notes && (
          <div className="text-xs text-green-600">Sostenibilità: {material.sustainability_notes}</div>
        )}
        {material.system_compatibility && (
          <div className="text-xs text-indigo-600">Compatibilità: {material.system_compatibility}</div>
        )}
        {material.fire_performance_notes && (
          <div className="text-xs text-orange-600">Fuoco: {material.fire_performance_notes}</div>
        )}
      </div>
    );
  }
  // Default
  return (
    <div>
      <div className="font-medium">{material.name}</div>
      {material.description && (
        <div className="text-sm text-muted-foreground truncate max-w-xs">
          {material.description}
        </div>
      )}
    </div>
  );
};

export default MaterialDetailsCell;
