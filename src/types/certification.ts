export interface CertifiedStratigraphyMaterial {
  id: string;
  certification_id: string;
  position_type: string;
  position_side?: string;
  material_description: string;
  material_code?: string;
  thickness?: number;
  specifications?: string;
  position_order?: number;
  created_at: string;
}

export interface CertificationData {
  id: string;
  name: string;
  code: string;
  type: string;
  value: string;
  certifier: string;
  issue_date: string;
  expiry_date: string;
  fire_resistance_class?: string;
  max_height?: number;
  acoustic_reduction?: number;
  acoustic_report_code?: string;
  extension_code?: string;
  supplier_name?: string;
  solution_code?: string;
  solution_number?: string;
  wall_thickness?: number;
  structure_width?: number;
  fire_test_report_code?: string;
  catalog_page?: string;
  curvature_radius?: number;
  curvature_radius_description?: string;
  break_resistance?: string;
  break_resistance_report_code?: string;
  break_resistance_notes?: string;
  document_url?: string;
  created_at: string;
  updated_at: string;
  materials?: CertifiedStratigraphyMaterial[];
}

export interface CertifiedStratigraphyFormData {
  name: string;
  description: string;
  type: 'single' | 'double' | 'plating' | 'counterwall' | 'ceiling';
  fire_resistance: string;
  max_height?: number;
  acoustic_reduction?: number;
  acoustic_report_code?: string;
  solution_number: string;
  solution_code?: string;
  extension_code?: string;
  supplier_name?: string;
  wall_thickness?: number;
  structure_width?: number;
  fire_test_report_code?: string;
  catalog_page?: string;
  curvature_radius?: number;
  curvature_radius_description?: string;
  break_resistance?: string;
  break_resistance_report_code?: string;
  break_resistance_notes?: string;
  materials: CertifiedStratigraphyMaterial[];
}
